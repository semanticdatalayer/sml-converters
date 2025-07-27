import { Flags } from "@oclif/core";
import { SnowflakeAuthenticators } from "./cortex-connect/SnowflakeAuth";
import { enumUtil } from "../../shared/enum-util";

export const cortexFlags = {
  source: Flags.directory({
    description: "Source folder",
    default: "./",
    required: false,
    aliases: ["s"],
  }),
  output: Flags.directory({
    description: "Directory in which to write cortex yaml output file(s)",
    required: false,
    default: "./cortex_output/",
    aliases: ["o"],
  }),
  clean: Flags.boolean({
    description: "Clean the output folder contents without the .git folder",
    required: false,
    default: false,
  }),
  keepfiles: Flags.boolean({
    description: "Keep created SML and YAML files",
    required: false,
    default: false,
  }),

  // Github URL and Authentication flags
  gitURL: Flags.url({
    description: "GitHub repository URL to pull SML models from",
    required: false,
    aliases: ["github"],
  }),
  gitToken: Flags.string({
    description: "GitHub token for authentication",
    env: "GITHUB_TOKEN",
    required: false,
  }),
  gitUsername: Flags.string({
    description: "GitHub username for authentication",
    env: "GITHUB_USERNAME",
    required: false,
  }),
  gitPassword: Flags.string({
    description: "GitHub password for authentication",
    env: "GITHUB_PASSWORD",
    required: false,
  }),

  // Snowflake Configuration flags
  snowflakeAccount: Flags.string({
    description: "Snowflake account identifier",
    required: false,
    env: "SNOWFLAKE_ACCOUNT",
  }),
  snowflakeDatabase: Flags.string({
    description: "Snowflake database name",
    required: false,
    env: "SNOWFLAKE_DATABASE",
  }),
  snowflakeSchema: Flags.string({
    description: "Snowflake schema name",
    required: false,
    env: "SNOWFLAKE_SCHEMA",
  }),
  snowflakeStage: Flags.string({
    description: "Snowflake stage name for uploading files",
    required: false,
    env: "SNOWFLAKE_STAGE",
  }),
  snowflakeWarehouse: Flags.string({
    description: "Snowflake warehouse name",
    required: false,
    env: "SNOWFLAKE_WAREHOUSE",
    hidden: true, // Hide this flag from help output
  }),
  snowflakeRole: Flags.string({
    description: "Snowflake role to use for the connection",
    required: false,
    env: "SNOWFLAKE_ROLE",
    hidden: true, // Hide this flag from help output
  }),

  // Snowflake Authentication flags
  snowflakeAuthenticator: Flags.string({
    description: "Snowflake authenticator type",
    required: false,
    env: "SNOWFLAKE_AUTHENTICATOR",
    default: "SNOWFLAKE",
    options: enumUtil.getAllValues(SnowflakeAuthenticators, "string"),
  }),
  snowflakeToken: Flags.string({
    description: "Snowflake OAuth token for authentication",
    required: false,
    env: "SNOWFLAKE_TOKEN",
  }),
  snowflakeUsername: Flags.string({
    description: "Snowflake username for authentication",
    required: false,
    env: "SNOWFLAKE_USERNAME",
  }),
  snowflakePassword: Flags.string({
    description: "Snowflake password or PAT for authentication",
    required: false,
    env: "SNOWFLAKE_PASSWORD",
  }),
  passcode: Flags.string({
    description: "MFA passcode provided by DUO",
    required: false,
  }),
  privateKey: Flags.string({
    description:
      "Specifies the private key (in PEM format) for key pair authentication",
    required: false,
  }),
  privateKeyPath: Flags.file({
    description: "Specifies the local path to the private key file",
    required: false,
  }),
  privateKeyPass: Flags.string({
    description: "Specifies the passphrase to decrypt the private key file",
    required: false,
  }),
  oauthClientId: Flags.string({
    description:
      "Value of client id provided by the identity provider for Snowflake integration",
    required: false,
  }),
  oauthClientSecret: Flags.string({
    description:
      "Value of the client secret provided by the identity provider for Snowflake integration",
    required: false,
  }),
  oauthAuthorizationUrl: Flags.url({
    description:
      "Identity provider endpoint supplying the authorization code to the driver",
    required: false,
  }),
  oauthTokenRequestUrl: Flags.url({
    description:
      "Identity Provider endpoint supplying the access tokens to the driver",
    required: false,
  }),
};
