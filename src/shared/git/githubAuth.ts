import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import fs from "fs";
import { GitHubAuth, PullConfig, PullResult } from "./types";
import { parseRepoUrl, prepareLocalDirectory, removeDirectory } from "./utils";
import { Logger } from "../logger";

export class GitHubAuthentication {
  private config: PullConfig;
  private logger: Logger;

  constructor(config: PullConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Pulls a Git repository to a local directory, optionally cleaning the directory first.
   *
   * @param cleanDir - Whether to clean the local directory before pulling. Defaults to `true`.
   * @returns A promise that resolves to a `PullResult` indicating success or failure, with additional details.
   */
  async pullRepository(cleanDir: boolean = true): Promise<PullResult> {
    const { repoUrl, localDir, auth } = this.config;

    try {
      // Parse repository URL and extract branch if specified
      const { url: gitUrl, branch } = parseRepoUrl(repoUrl);

      // Prepare local directory
      await prepareLocalDirectory(localDir, cleanDir);

      // Create auth callback
      const onAuth = createAuthCallback(auth);

      // Clone the repository
      const cloneOptions: any = {
        fs,
        http,
        dir: localDir,
        url: gitUrl,
        singleBranch: true,
        depth: 1,
        onAuth,
      };

      // Only specify ref if a branch was provided in the URL
      if (branch) {
        cloneOptions.ref = branch;
      }

      await git.clone(cloneOptions);

      return {
        success: true,
        message: `Successfully pulled repository to ${localDir}`,
        localDir,
      };
    } catch (error: any) {
      // Clean up partial clone if it exists
      try {
        await fs.promises.rm(localDir, { recursive: true, force: true });
      } catch (cleanupError) {
        this.logger.error(`Failed to cleanup after error: ${cleanupError}`);
      }

      return {
        success: false,
        message: `Failed to pull repository: ${error.message}`,
        error,
      };
    }
  }

  async removeRepository(): Promise<void> {
    const { localDir } = this.config;
    return removeDirectory(
      localDir,
      { force: true, recursive: true },
      this.logger,
    );
  }
}

/**
 * Converts authentication config to isomorphic-git onAuth callback
 */
function createAuthCallback(auth: GitHubAuth) {
  return () => {
    switch (auth.type) {
      case "username-password":
        return {
          username: auth.username,
          password: auth.password,
        };
      case "token":
      case "fine-grained-token":
      case "oauth":
        return {
          username: auth.token,
          password: "x-oauth-basic", // GitHub token auth format
        };
      default:
        throw new Error("Invalid authentication type");
    }
  };
}

