import { makeHandler } from "@keystatic/astro/api";
import config from "../keystatic.config";
import path from "node:path";
export const prerender = false;
export const ALL = makeHandler({
  config,
  localBaseDirectory: path.resolve(".studio"),
});
