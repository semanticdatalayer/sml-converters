import fs from "fs";
import path from "path";
import { Logger } from "../../../shared/logger";
import { SnowflakeAuthenticators } from "./SnowflakeAuth";

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Validates the command configuration and flags for required information.
 *
 * @param flags - Command flags to validate
 * @param logger - Logger instance for error reporting
 * @throws {ConfigurationError} When configuration is invalid
 */
export function validateConfiguration(flags: any, logger: Logger): void {
  // Validate Snowflake configuration
  const required = ["snowflakeAccount", "snowflakeDatabase", "snowflakeSchema"];
  const missing = required.filter((field) => !flags[field]);

  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing required Snowflake configuration: ${missing.join(", ")}`,
    );
  }

  // native SSO okta "authenticator" is its URL
  if (flags.authenticator.includes(`.okta.com`)) {
    ensureFlags(flags, ["username", "password"]);
    return;
  }
  const addHandlers: Record<
    SnowflakeAuthenticators,
    (authObject: any) => void
  > = {
    [SnowflakeAuthenticators.externalBrowser]: (flags: any) => {}, // does not require other flags
    [SnowflakeAuthenticators.password]: (flags: any) => {
      ensureFlags(flags, ["username", "password"]);
    },
    [SnowflakeAuthenticators.okta]: (flags: any) => {}, // Gets handled beforehand
    [SnowflakeAuthenticators.pat]: (flags: any) => {
      ensureFlags(flags, ["username", "password"]);
    },
    [SnowflakeAuthenticators.oauthCode]: (flags: any) => {
      throw new ConfigurationError(
        `${SnowflakeAuthenticators.oauthCode} is currently not supported`,
      );
    },
    [SnowflakeAuthenticators.oauthClient]: (flags: any) => {
      throw new ConfigurationError(
        `${SnowflakeAuthenticators.oauthClient} is currently not supported`,
      );
    },
    [SnowflakeAuthenticators.oauth]: (flags: any) => {
      ensureFlags(flags, ["token"]);
    },
    [SnowflakeAuthenticators.keypair]: (flags: any) => {
      ensureFlags(flags, ["username", "privateKeyPath"]);
      // If private key is encrypted, 'privateKeyPass' is also required
      if (fs.statSync(flags.privateKeyPath).isDirectory()) {
        // Path is directory, switch to rsa key file
        logger.warn(
          `'privateKeyPath' flag is a directory. Using: ${path.join(
            flags.privateKeyPath,
            "rsa_key.p8",
          )}`,
        );
        flags.privateKeyPath = path.join(flags.privateKeyPath, "rsa_key.p8");
      }
    },
    [SnowflakeAuthenticators.mfa]: (flags: any) => {
      ensureFlags(flags, [
        "username",
        "password",
        "passcode",
      ]);
    },
  };
  const handler =
    addHandlers[flags.snowflakeAuthenticator as SnowflakeAuthenticators];
  if (!handler) {
    logger.error(
      `Unknown Snowflake Authentication method ${flags.snowflakeAuthenticator}`,
    );
    return;
  }
  handler(flags);
}

/**
 * Check to see if required properties exist in flags
 *
 * @param flags flags object
 * @param flagsToCheck flags required in flags object
 * @throws {ConfigurationError} If a flag to check is not in flags
 */
function ensureFlags<T extends Record<string, any>>(
  flags: T,
  flagsToCheck: (keyof T)[],
): void {
  const missingProperties: string[] = [];
  flagsToCheck.forEach((property) => {
    const exists = flags[property] !== undefined && flags[property] !== null;

    if (!exists) {
      missingProperties.push(String(property));
    }
  });
  if (missingProperties.length > 0) {
    throw new ConfigurationError(
      `Snowflake authentication '${
        flags.snowflakeAuthenticator
      }' requires properties: ${missingProperties.join(", ")}`,
    );
  }
}
