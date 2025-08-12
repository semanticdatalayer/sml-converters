// Authentication types
export enum SnowflakeAuthenticators {
  password = "SNOWFLAKE",
  externalBrowser = "EXTERNALBROWSER",
  keypair = "SNOWFLAKE_JWT",
  mfa = "USERNAME_PASSWORD_MFA",
  pat = "PROGRAMMATIC_ACCESS_TOKEN",
  okta = "*.okta.com",
  oauth = "OAUTH",
  oauthCode = "OAUTH_AUTHORIZATION_CODE",
  oauthClient = "OAUTH_CLIENT_CREDENTIALS",
}

export interface SnowflakeAuth {
  authenticator: SnowflakeAuthenticators;
  token?: string;
  username?: string;
  password?: string;
  passcode?: string;
  privateKey?: string;
  privateKeyPath?: string;
  privateKeyPass?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthAuthorizationUrl?: string;
  oauthTokenRequestUrl?: string;
}
