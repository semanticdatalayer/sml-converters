// Authentication types
export interface PasswordAuth {
  authenticator: 'snowflake' | 'SNOWFLAKE';
  username: string;
  password: string;
}

// export interface TokenAuth {
//   authenticator: 'token';
//   token: string;
// }

export interface ExternalBrowserAuth {
  authenticator: 'externalbrowser' | 'EXTERNALBROWSER';
}

export interface OAuthAuth {
  authenticator: 'oauth' | 'OAUTH';
  token: string;
}

export type SnowflakeAuth = PasswordAuth | ExternalBrowserAuth | OAuthAuth;
