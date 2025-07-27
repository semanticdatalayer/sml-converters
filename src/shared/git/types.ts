// Authentication types
export interface UsernamePasswordAuth {
  type: "username-password";
  username: string;
  password: string;
}

export interface TokenAuth {
  type: "token";
  token: string;
}

export interface FineGrainedTokenAuth {
  type: "fine-grained-token";
  token: string;
}

export interface OAuthAuth {
  type: "oauth";
  token: string;
}

export type GitHubAuth =
  | UsernamePasswordAuth
  | TokenAuth
  | FineGrainedTokenAuth
  | OAuthAuth;

export interface gitCredentials {
  gitURL: URL | undefined;
  gitUsername: string | undefined;
  gitPassword: string | undefined;
  gitToken: string | undefined;
}

// Configuration for repository pulling
export interface PullConfig {
  repoUrl: string;
  localDir: string;
  auth: GitHubAuth;
}

// Result type for pull operations
export interface PullResult {
  success: boolean;
  message: string;
  localDir?: string;
  error?: Error;
}
export class GitPullError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitPullError";
    Object.setPrototypeOf(this, GitPullError.prototype);
  }
}
