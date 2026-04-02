/// <reference types="node" />

import { defineConfig } from "vite";

function getGithubPagesBase(): string {
  const explicitBase = process.env.VITE_BASE_PATH;
  if (explicitBase) {
    return explicitBase;
  }

  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (repository) {
    // User/org pages repos (<name>.github.io) are served from domain root.
    if (repository.endsWith(".github.io")) {
      return "/";
    }
    return `/${repository}/`;
  }

  // Safe fallback for this repository's Pages project URL.
  return "/vulcan-app/";
}

export default defineConfig({
  base: getGithubPagesBase(),
});
