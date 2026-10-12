import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  Publisher,
  git,
  command,
  deploymentState,
  validateSnapshot,
} from "../studio/publish.mjs";
import {
  init,
  editPost,
  collectSelection,
  snapshotFingerprint,
} from "../studio/content.mjs";

const sample = await readFile(
  new URL("../src/content/posts/why-this-blog.mdoc", import.meta.url),
  "utf8",
);
async function fixture(t) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "hui-publish-"));
  const root = path.join(temp, "blog"),
    remote = path.join(temp, "remote.git");
  t.after(async () => {
    assert(path.basename(temp).startsWith("hui-publish-"));
    await rm(temp, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  });
  await mkdir(root);
  await command(
    "git",
    ["init", "--bare", "--initial-branch=main", remote],
    temp,
  );
  await git(root, "init", "--initial-branch=main");
  await git(root, "config", "user.name", "Studio test");
  await git(root, "config", "user.email", "studio-test@example.test");
  await mkdir(path.join(root, "src/content/posts"), { recursive: true });
  await mkdir(path.join(root, "src/data"), { recursive: true });
  await writeFile(path.join(root, "src/content/posts/example.mdoc"), sample);
  await writeFile(path.join(root, "src/data/site.json"), "{}");
  await writeFile(
    path.join(root, ".gitignore"),
    ".studio/\nnode_modules/\ndist/\n",
  );
  await mkdir(path.join(root, "node_modules"));
  await git(root, "add", ".");
  await git(root, "commit", "-m", "Initial");
  await git(root, "remote", "add", "origin", remote);
  await git(root, "push", "-u", "origin", "main");
  await init(root);
  await editPost(root, "example");
  await writeFile(
    path.join(root, ".studio/posts/example.mdoc"),
    sample + "\nSelected revision.\n",
  );
  return { root, remote, temp };
}
function fakeCommands(options = {}) {
  return async (_bin, args, cwd) => {
    if (args[0] === "auth") return "";
    if (args[0] === "api") {
      if (options.statusError) throw new Error("offline");
      const sha = await git(cwd, "rev-parse", "HEAD");
      return JSON.stringify({
        workflow_runs: [
          {
            name: "Deploy to GitHub Pages",
            head_sha: sha,
            status: "completed",
            conclusion: "success",
            html_url: "https://github.com/example/actions/1",
          },
        ],
      });
    }
    if (args[0] === "scripts/build.mjs" && options.buildError)
      throw new Error("Build failed");
    return "";
  };
}
test("deployment success requires the matching commit and successful workflow", () => {
  assert.equal(
    deploymentState(
      [
        {
          head_sha: "old",
          name: "Deploy to GitHub Pages",
          status: "completed",
          conclusion: "success",
        },
      ],
      "new",
    ).phase,
    "deploying",
  );
  assert.equal(
    deploymentState(
      [
        {
          head_sha: "new",
          name: "Deploy to GitHub Pages",
          status: "completed",
          conclusion: "failure",
        },
      ],
      "new",
    ).phase,
    "failed",
  );
});
test("successful publication pushes selected snapshot and preserves private drafts", async (t) => {
  const { root } = await fixture(t);
  await writeFile(
    path.join(root, ".studio/posts/private.mdoc"),
    sample + "\nPRIVATE\n",
  );
  const p = new Publisher(root, { command: fakeCommands() });
  await p.start({ slugs: ["example"] });
  await p.task;
  assert.equal(p.state.phase, "successful", p.state.message);
  assert.match(
    await git(root, "show", "origin/main:src/content/posts/example.mdoc"),
    /Selected revision/,
  );
  assert.doesNotMatch(
    await git(root, "ls-tree", "-r", "--name-only", "origin/main"),
    /private|\.studio/,
  );
  assert.match(
    await readFile(path.join(root, ".studio/posts/private.mdoc"), "utf8"),
    /PRIVATE/,
  );
});
test("failed builds never push and keep working copies", async (t) => {
  const { root } = await fixture(t);
  const before = await git(root, "rev-parse", "origin/main");
  const p = new Publisher(root, {
    command: fakeCommands({ buildError: true }),
  });
  await p.start({ slugs: ["example"] });
  await p.task;
  assert.equal(p.state.phase, "failed");
  assert.match(p.state.message, /Build failed/);
  assert.equal(await git(root, "rev-parse", "origin/main"), before);
  assert.match(
    await readFile(path.join(root, ".studio/posts/example.mdoc"), "utf8"),
    /Selected revision/,
  );
});
test("remote races reject the push without force or draft loss", async (t) => {
  const { root } = await fixture(t);
  const p = new Publisher(root, {
    command: fakeCommands(),
    git: async (cwd, ...args) => {
      if (args[0] === "push") throw new Error("rejected: non-fast-forward");
      return git(cwd, ...args);
    },
  });
  await p.start({ slugs: ["example"] });
  await p.task;
  assert.equal(p.state.phase, "failed");
  assert.match(p.state.message, /non-fast-forward/);
});
test("stale content baselines stop publication", async (t) => {
  const { root } = await fixture(t);
  const snapshot = await collectSelection(root, { slugs: ["example"] });
  await writeFile(
    path.join(root, "src/content/posts/example.mdoc"),
    sample + "\nRemote update.",
  );
  await assert.rejects(
    validateSnapshot(root, snapshot),
    /Remote content changed/,
  );
});
test("changes saved after review require a new review", async (t) => {
  const { root } = await fixture(t);
  const selection = { slugs: ["example"] };
  const fingerprint = snapshotFingerprint(
    await collectSelection(root, selection),
  );
  await writeFile(
    path.join(root, ".studio/posts/example.mdoc"),
    sample + "\nNot reviewed.\n",
  );
  const p = new Publisher(root, { command: fakeCommands() });
  await assert.rejects(p.start(selection, fingerprint), /changed after review/);
  assert.equal(p.active, false);
});
test("authentication failures stop before uploading", async (t) => {
  const { root } = await fixture(t);
  const before = await git(root, "rev-parse", "origin/main");
  const p = new Publisher(root, {
    command: async () => {
      throw new Error("Authentication failed");
    },
  });
  await p.start({ slugs: ["example"] });
  await p.task;
  assert.equal(p.state.phase, "failed");
  assert.match(p.state.message, /Authentication/);
  assert.equal(await git(root, "rev-parse", "origin/main"), before);
});
test("a changed remote main stops publication", async (t) => {
  const { root } = await fixture(t);
  const p = new Publisher(root, {
    command: fakeCommands(),
    git: async (cwd, ...args) => {
      if (args[0] === "rev-parse" && args[1] === "origin/main")
        return "changed-remote";
      return git(cwd, ...args);
    },
  });
  await p.start({ slugs: ["example"] });
  await p.task;
  assert.equal(p.state.phase, "failed");
  assert.match(p.state.message, /not synchronized/);
});
test("replacing selected media cannot alter an unselected article", async (t) => {
  const { root } = await fixture(t);
  await mkdir(path.join(root, "public/media"), { recursive: true });
  await writeFile(path.join(root, "public/media/cover.png"), "old");
  await writeFile(
    path.join(root, "src/content/posts/other.mdoc"),
    sample + "\n![Shared](/hui-blog/media/cover.png)\n",
  );
  const selected = {
    files: new Map([["public/media/cover.png", Buffer.from("new")]]),
    expected: {},
  };
  await assert.rejects(validateSnapshot(root, selected), /also used by other/);
  selected.files.set("src/content/posts/other.mdoc", Buffer.from(sample));
  await validateSnapshot(root, selected);
  assert.equal(
    await readFile(path.join(root, "public/media/cover.png"), "utf8"),
    "new",
  );
});
test("repeated publish clicks cannot start concurrent jobs", async (t) => {
  const { root } = await fixture(t);
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  const p = new Publisher(root, {
    collect: async (...args) => {
      await gate;
      return collectSelection(...args);
    },
    command: fakeCommands({ buildError: true }),
  });
  const first = p.start({ slugs: ["example"] });
  await assert.rejects(p.start({ slugs: ["example"] }), /already in progress/);
  release();
  await first;
  await p.task;
});
test("unavailable deployment status is not reported as success", async (t) => {
  const { root } = await fixture(t);
  const p = new Publisher(root, {
    command: fakeCommands({ statusError: true }),
  });
  await p.start({ slugs: ["example"] });
  await p.task;
  assert.equal(p.state.phase, "status-unavailable");
  assert.ok(p.state.sha);
  await assert.rejects(p.start({ slugs: ["example"] }), /already in progress/);
});
