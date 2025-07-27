// Authentication types
export enum SnowflakeAuthenticators {
  oauth = "OAUTH",
  password = "SNOWFLAKE",
  externalBrowser = "EXTERNALBROWSER",
  keypair = "SNOWFLAKE_JWT",
  mfa = "USERNAME_PASSWORD_MFA",
  pat = "PROGRAMMATIC_ACCESS_TOKEN",
  okta = "*.okta.com",
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
