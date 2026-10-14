import { spawn } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
  symlink,
  unlink,
  access,
  readdir,
  rm,
  lstat,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import {
  collectSelection,
  hash,
  readOptional,
  atomicWrite,
  bases,
  within,
  snapshotFingerprint,
  mediaReferences,
} from "./content.mjs";

export function command(bin, args, cwd, options = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, ...options.env };
    delete env.BLOG_STUDIO;
    const child = spawn(bin, args, {
      cwd,
      env,
      windowsHide: true,
      shell: false,
    });
    let out = "",
      err = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(
        new Error(`${path.basename(bin)} timed out. Your drafts are safe.`),
      );
    }, options.timeout ?? 120000);
    child.stdout.on("data", (b) => {
      out = (out + b).slice(-30000);
    });
    child.stderr.on("data", (b) => {
      err = (err + b).slice(-30000);
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      code === 0
        ? resolve(out.trim())
        : reject(
            new Error((err || out || `${bin} exited ${code}`).slice(-6000)),
          );
    });
  });
}
export const git = (root, ...args) =>
  command(
    "git",
    ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, ...args],
    root,
  );
export async function ghBinary(root) {
  const local = path.join(root, ".tools/gh/bin/gh.exe");
  try {
    await access(local);
    return local;
  } catch {
    return "gh";
  }
}
export async function githubEnvironment(root, runGit = git, env = process.env) {
  if (env.HTTPS_PROXY || env.https_proxy || env.ALL_PROXY || env.all_proxy)
    return {};
  try {
    const proxy = await runGit(root, "config", "--get", "http.proxy");
    // Keep GitHub CLI on the same project-configured connection as Git. This
    // does not change system proxy settings or copy credentials into files.
    return proxy ? { HTTPS_PROXY: proxy, HTTP_PROXY: proxy } : {};
  } catch {
    return {};
  }
}
export async function authStatus(root) {
  try {
    await command(await ghBinary(root), ["auth", "status"], root, {
      env: await githubEnvironment(root),
    });
    return { ok: true };
  } catch (error) {
    return authFailure(error.message);
  }
}
export function authFailure(message) {
  const unavailable =
    /connection|tcp|tls|network|timed? ?out|timeout|EOF|temporary|resolve host|5\d\d/i.test(
      message,
    );
  return {
    ok: false,
    unavailable,
    message: unavailable
      ? "GitHub could not be reached. Check the connection and refresh."
      : "Sign in once with GitHub Setup.cmd, then refresh Studio.",
  };
}
export function deploymentState(runs, sha) {
  const run = runs.find(
    (r) => r.head_sha === sha && r.name === "Deploy to GitHub Pages",
  );
  if (!run)
    return {
      phase: "deploying",
      message: "Waiting for GitHub Actions to start.",
    };
  if (run.status !== "completed")
    return {
      phase: "deploying",
      message: "GitHub Pages is building and deploying.",
      runUrl: run.html_url,
    };
  return run.conclusion === "success"
    ? {
        phase: "successful",
        message: "Your changes are live.",
        runUrl: run.html_url,
      }
    : {
        phase: "failed",
        message: `Deployment ${run.conclusion}. Your drafts are safe.`,
        runUrl: run.html_url,
      };
}
export async function validateSnapshot(folder, selected) {
  for (const [file, expected] of Object.entries(selected.expected)) {
    const actual = await readOptional(path.join(folder, file));
    if ((actual === null ? null : hash(actual)) !== expected)
      throw new Error(
        `Remote content changed: ${file}. Sync and reconcile this draft before publishing.`,
      );
  }
  for (const [file, bytes] of selected.files) {
    const target = within(folder, file);
    if (file.startsWith("public/media/")) {
      try {
        const existing = await readFile(target);
        if (!existing.equals(bytes)) {
          const mediaPath = file.slice("public/media/".length);
          for (const name of await readdir(
            path.join(folder, "src/content/posts"),
          )) {
            if (
              !name.endsWith(".mdoc") ||
              selected.files.has(`src/content/posts/${name}`)
            )
              continue;
            const other = await readFile(
              path.join(folder, "src/content/posts", name),
              "utf8",
            );
            if (mediaReferences(other).includes(mediaPath))
              throw new Error(
                `This image is also used by ${name}. Select that article too before replacing the shared image.`,
              );
          }
        }
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
}

async function createPublicationClone(root, folder, baseline, runGit) {
  // A linked worktree still needs writable metadata in the original .git.
  // Copy committed Git state into an independent repository instead. In
  // particular, local drafts and untracked application files are not copied.
  await runGit(
    root,
    "clone",
    "--no-hardlinks",
    "--no-checkout",
    "--",
    root,
    folder,
  );
  const origin = await runGit(root, "remote", "get-url", "origin");
  const pushOrigin = await runGit(
    root,
    "remote",
    "get-url",
    "--push",
    "origin",
  );
  // A local clone initially points back to root. Never push the publication
  // there: preserve the project's actual fetch and push destinations.
  await runGit(folder, "remote", "set-url", "origin", origin);
  await runGit(folder, "remote", "set-url", "--push", "origin", pushOrigin);
  for (const key of ["user.name", "user.email", "http.proxy", "http.version"]) {
    let value;
    try {
      value = await runGit(root, "config", "--get", key);
    } catch {
      // These settings may be absent; Git then uses its normal defaults.
      continue;
    }
    await runGit(folder, "config", "--local", key, value);
  }
  await runGit(folder, "checkout", "--detach", baseline);
}

async function removePublicationClone(releaseRoot, folder) {
  // Only delete the exact temporary directory created for this publication.
  const parent = path.resolve(releaseRoot);
  const target = path.resolve(folder);
  if (
    path.dirname(target) !== parent ||
    !/^snapshot-[a-zA-Z0-9]+$/.test(path.basename(target))
  )
    throw new Error("Invalid publication cleanup path.");
  const stat = await lstat(target);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error("Invalid publication directory.");
  if (path.dirname(await realpath(target)) !== (await realpath(parent)))
    throw new Error("Publication directory escapes its temporary parent.");
  await rm(target, { recursive: true, force: true, maxRetries: 3 });
}

export class Publisher {
  constructor(root, dependencies = {}) {
    this.root = root;
    this.runGit = dependencies.git ?? git;
    this.run = dependencies.command ?? command;
    this.collect = dependencies.collect ?? collectSelection;
    this.state = { phase: "idle", message: "" };
    this.active = false;
  }
  async start(selection, reviewedFingerprint) {
    if (
      this.active ||
      this.state.syncPending ||
      ["building", "uploading", "deploying", "status-unavailable"].includes(
        this.state.phase,
      )
    )
      throw new Error("A publication is already in progress.");
    this.active = true;
    try {
      const snapshot = await this.collect(this.root, selection);
      if (
        reviewedFingerprint &&
        snapshotFingerprint(snapshot) !== reviewedFingerprint
      )
        throw new Error(
          "The selected content changed after review. Review the changes again before publishing.",
        );
      this.state = {
        phase: "building",
        message: "Checking and building the selected changes.",
        id: randomUUID(),
      };
      this.task = this.publish(snapshot)
        .catch(async (error) => {
          const uploaded = this.state.uploaded;
          this.state = {
            ...this.state,
            phase: uploaded ? "status-unavailable" : "failed",
            message: uploaded
              ? "Uploaded, but follow-up checks could not finish. Refresh to check deployment; do not publish again."
              : error.message,
          };
          await atomicWrite(
            path.join(this.root, ".studio/last-publication.json"),
            JSON.stringify(this.state),
          ).catch(() => {});
        })
        .finally(() => {
          this.active = false;
        });
      return this.state;
    } catch (e) {
      this.active = false;
      throw e;
    }
  }
  async publish(selected) {
    const root = this.root,
      gh = await ghBinary(root);
    await this.run(gh, ["auth", "status"], root, {
      env: await githubEnvironment(root, this.runGit),
    });
    await this.runGit(root, "fetch", "origin", "main");
    const head = await this.runGit(root, "rev-parse", "HEAD");
    const remote = await this.runGit(root, "rev-parse", "origin/main");
    if (head !== remote)
      throw new Error(
        "Application code is not synchronized with main. Finish deploying or synchronizing the application first. Local drafts are preserved.",
      );
    if (
      await this.runGit(root, "status", "--porcelain", "--untracked-files=no")
    )
      throw new Error(
        "Application source has uncommitted changes. Finish those changes before publishing articles.",
      );
    // The project may live on exFAT, where junctions are unavailable. Windows'
    // per-user temporary volume supports the dependency link for isolated builds.
    const releaseRoot = path.join(
      os.tmpdir(),
      "hui-blog-publications",
      hash(root).slice(0, 16),
    );
    await mkdir(releaseRoot, { recursive: true });
    const folder = await mkdtemp(path.join(releaseRoot, "snapshot-"));
    let dependencyLink = false;
    try {
      await createPublicationClone(root, folder, remote, this.runGit);
      await validateSnapshot(folder, selected);
      await symlink(
        path.join(root, "node_modules"),
        path.join(folder, "node_modules"),
        process.platform === "win32" ? "junction" : "dir",
      );
      dependencyLink = true;
      await this.run(process.execPath, ["scripts/build.mjs"], folder, {
        timeout: 180000,
      });
      await this.run(process.execPath, ["scripts/verify-build.mjs"], folder);
      await this.runGit(folder, "add", "--", ...selected.files.keys());
      if (!(await this.runGit(folder, "diff", "--cached", "--name-only")))
        throw new Error("The selected content is already published.");
      await this.runGit(
        folder,
        "commit",
        "-m",
        `Publish ${selected.selection.slugs.length} article(s)${selected.selection.settings ? " and site settings" : ""}`,
      );
      const sha = await this.runGit(folder, "rev-parse", "HEAD");
      this.state = {
        ...this.state,
        phase: "uploading",
        message: "Uploading the publication.",
        sha,
      };
      await this.runGit(folder, "push", "origin", "HEAD:main");
      const publishedBases = {};
      for (const slug of selected.selection.slugs)
        publishedBases[slug] = hash(
          selected.files.get(`src/content/posts/${slug}.mdoc`).toString("utf8"),
        );
      if (selected.selection.settings)
        publishedBases["@settings"] = hash(
          selected.files.get("src/data/site.json").toString("utf8"),
        );
      this.state = {
        ...this.state,
        phase: "deploying",
        message: "Uploaded. Waiting for GitHub Pages.",
        sha,
        uploaded: true,
        syncPending: true,
        publishedBases,
      };
      await atomicWrite(
        path.join(root, ".studio/last-publication.json"),
        JSON.stringify(this.state),
      );
      await this.synchronizePublication();
      await this.pollDeployment();
    } finally {
      // Unlink the dependency junction itself before removing the clone. If
      // unlink fails, retain the clone rather than risk the shared dependencies.
      let canRemove = true;
      if (dependencyLink) {
        try {
          await unlink(path.join(folder, "node_modules"));
        } catch {
          canRemove = false;
        }
      }
      if (canRemove) {
        try {
          await removePublicationClone(releaseRoot, folder);
        } catch {}
      }
    }
  }
  async synchronizePublication() {
    if (!this.state.syncPending || !this.state.sha) return;
    try {
      // Retrying this read-only download is safe; never retry or force a push.
      // Git's fast-forward merge refuses conflicting local changes.
      await this.runGit(this.root, "fetch", "origin", "main");
      await this.runGit(this.root, "merge", "--ff-only", this.state.sha);
      const base = await bases(this.root);
      Object.assign(base, this.state.publishedBases);
      await atomicWrite(
        path.join(this.root, ".studio/bases.json"),
        JSON.stringify(base, null, 2),
      );
      this.state = { ...this.state, syncPending: false, syncError: undefined };
    } catch (error) {
      // Upload already succeeded. Keep checking its deployment and retry the
      // local synchronization on Refresh, including after a Studio restart.
      this.state = {
        ...this.state,
        syncPending: true,
        syncError: error.message,
      };
    }
    await atomicWrite(
      path.join(this.root, ".studio/last-publication.json"),
      JSON.stringify(this.state),
    );
  }
  async pollDeployment() {
    await this.synchronizePublication();
    if (
      !this.state.sha ||
      !["deploying", "status-unavailable"].includes(this.state.phase)
    )
      return this.state;
    try {
      const data = JSON.parse(
        await this.run(
          await ghBinary(this.root),
          [
            "api",
            `repos/Zjuhui/hui-blog/actions/runs?head_sha=${this.state.sha}&per_page=30`,
          ],
          this.root,
          { env: await githubEnvironment(this.root, this.runGit) },
        ),
      );
      this.state = {
        ...this.state,
        ...deploymentState(data.workflow_runs, this.state.sha),
      };
    } catch {
      this.state = {
        ...this.state,
        phase: "status-unavailable",
        message:
          "Uploaded, but deployment status is unavailable. Check GitHub Actions; success has not been confirmed.",
        runUrl: "https://github.com/Zjuhui/hui-blog/actions",
      };
    }
    await atomicWrite(
      path.join(this.root, ".studio/last-publication.json"),
      JSON.stringify(this.state),
    );
    return this.state;
  }
}
