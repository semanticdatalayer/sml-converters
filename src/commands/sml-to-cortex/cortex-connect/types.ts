// Authentication types
export interface PasswordAuth {
  authenticator: "SNOWFLAKE";
  username: string;
  password: string;
}

// export interface TokenAuth {
//   authenticator: 'token';
//   token: string;
// }

export interface ExternalBrowserAuth {
  authenticator: "EXTERNALBROWSER";
}

export interface OAuthAuth {
  authenticator: "OAUTH";
  token: string;
}

export type SnowflakeAuth = PasswordAuth | ExternalBrowserAuth | OAuthAuth;
