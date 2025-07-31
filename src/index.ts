import { Command, execute } from "@oclif/core";
import { DbtToSmlCommand } from "./commands/dbt-to-sml/dbt-to-sml-command";
import { SMLToCortexCommand } from "./commands/sml-to-cortex/sml-to-cortex-command";
import { AddFilesToSnowflakeCommand } from "./commands/add-files-to-snowflake/add-snowflake-files-command";

export { default as INIT_HOOK } from "./hooks/init/init";

export const COMMANDS: Record<string, Command.Class> = {
  //TO SML COMMANDS
  "dbt-to-sml": DbtToSmlCommand,
  //FROM SML COMMAND
  "sml-to-cortex": SMLToCortexCommand,

  //OTHER
  "add-files-to-snowflake": AddFilesToSnowflakeCommand
};

export async function run() {
  await execute({ dir: __dirname });
}
