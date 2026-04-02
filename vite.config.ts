/// <reference types="node" />

import { defineConfig } from "vite";

function getGithubPagesBase(): string {
  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (!repository) {
    return "/";
  }

  // User/org pages repos (<name>.github.io) are served from domain root.
  if (repository.endsWith(".github.io")) {
    return "/";
  }

  return `/${repository}/`;
}

export default defineConfig({
  base: getGithubPagesBase(),
});
