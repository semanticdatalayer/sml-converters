import ConsoleLogger from "models/src/ConsoleLogger"; // "../../../../apps/cli/src/Logger/ConsoleLogger";

import { SMLTesting } from "./validation_testing";

const args = process.argv.slice(2);
let inputFolder = args.find((arg) => arg.startsWith("--inpath="));
if (!inputFolder) inputFolder = "/Users/dianne/Downloads/aml_from_as5"; // throw new Error(`Can't find required argument 'inpath'`);
// if (inputFolder.endsWith("/")) inputFolder = inputFolder.substring(0, inputFolder.length - 1);
inputFolder = inputFolder.split("=")[1];

// const inputFolder = "/Users/dianne/Downloads/aml_from_as5"; // "/Users/dianne/go/src/github.com/AtScaleInc/snowflake-atscale-collaboration/"; // "/Users/dianne/Downloads/TestRolePlay_sml"; //
// const modelToConvert = ""; // "Telemetry API"; // "TestRolePlay"; // "TPC-DS Benchmark Model"; // ""; // If none or not found and only 1 model exists, uses it
// const snowSemanticModelName = ""; // "Telemetry API"; // "TPCDS Benchmark SM"; // If no name given uses SML model name
// const exportFile = "/Users/dianne/Downloads/demo-snow-file.yml";
const logger = new ConsoleLogger();
// const converter = new SnowSemanticConverter(); // logger);

const smlTesting = new SMLTesting();
smlTesting.Validate(inputFolder, logger);
