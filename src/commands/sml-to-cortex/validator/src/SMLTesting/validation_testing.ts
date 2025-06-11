// import ConsoleLogger from "../../../../apps/cli/src/Logger/ConsoleLogger";
import { validateRepoFiles } from "../../../compiler-snowflake/validator";
import { ILogger } from "../../../models/src/ILogger";
import { IRepoValidatorResult } from "../../src/RepoValidator/IRepoValidator";

// import { SnowSemanticConverter } from "./snow-converter";

/* const inputFolder = "/Users/dianne/Downloads/aml_from_as5"; // "/Users/dianne/go/src/github.com/AtScaleInc/snowflake-atscale-collaboration/"; // "/Users/dianne/Downloads/TestRolePlay_sml"; //
// const modelToConvert = ""; // "Telemetry API"; // "TestRolePlay"; // "TPC-DS Benchmark Model"; // ""; // If none or not found and only 1 model exists, uses it
// const snowSemanticModelName = ""; // "Telemetry API"; // "TPCDS Benchmark SM"; // If no name given uses SML model name
// const exportFile = "/Users/dianne/Downloads/demo-snow-file.yml";
const logger = new ConsoleLogger();
// const converter = new SnowSemanticConverter(); // logger); */
const DEBUG = true;

// Or run from command line from packages: npx tsx converters/src/validation_testing.ts

export class SMLTesting {
  async Validate(inputFolder: string, logger: ILogger) {
    const validationResult = await validateRepoFiles(inputFolder, logger);
    const errorMessages = processValidation(validationResult, logger);
    if (errorMessages) {
      throw new Error(errorMessages);
    }
  }
}

// const smlTesting = new SMLTesting();
// smlTesting.Validate(inputFolder, logger);

function processValidation(validationResult: IRepoValidatorResult, logger: ILogger): string {
  let msgs = "";
  let warns = "";
  validationResult.filesOutput.forEach((v) =>
    v.compilationOutput.forEach((c) => {
      if (c.severity === "error") {
        if (!DEBUG || !(c.message === "must have required property 'relationships'")) {
          msgs += `\n   File '${v.relativePath}': ${c.message}`;
        }
      }
      if (c.severity.includes("warn")) {
        warns += `\n   File '${v.relativePath}': ${c.message}`;
      }
    })
  );
  if (msgs.length > 1) {
    msgs = "The following validation errors were found in the incoming SML and must be addressed:" + msgs;
  }
  if (warns.length > 1) {
    logger.warn("The following validation warnings were found in the incoming SML:" + warns);
  }
  return msgs;
}
