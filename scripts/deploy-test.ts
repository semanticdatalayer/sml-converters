#!/usr/bin/env tsx
/**
 * Deploy Test Script
 *
 * Converts a BIM file to SML and deploys to AtScale, capturing any errors.
 *
 * Required environment variables:
 * - ATSCALE_API_URL - AtScale API URL (e.g., http://localhost:10500/api)
 * - ATSCALE_API_TOKEN - AtScale API token
 *
 * Usage:
 *   npm run deploy-test
 *   npm run deploy-test -- --input ./path/to/file.bim
 *   npm run deploy-test -- --output-errors ./errors.json
 */

import fs from "fs/promises";
import path from "path";
import { execSync, spawnSync } from "child_process";
import { BimFileParser } from "../src/commands/bim-to-sml/bim-file-parser";
import { BimToYamlConverter } from "../src/commands/bim-to-sml/bim-converter/bim-to-sml-converter";
import { SmlResultWriter } from "../src/shared/sml-result-writer";
import { Logger } from "../src/shared/logger";

// Simple logger implementation
class DeployLogger implements Logger {
  constructor(private isVerbose: boolean = false) {}

  error(message: string) {
    console.error(`[ERROR] ${message}`);
  }
  warn(message: string) {
    if (this.isVerbose) console.warn(`[WARN] ${message}`);
  }
  info(message: string) {
    if (this.isVerbose) console.log(`[INFO] ${message}`);
  }
  http(message: string) {
    if (this.isVerbose) console.log(`[HTTP] ${message}`);
  }
  verbose(message: string) {
    if (this.isVerbose) console.log(`[VERBOSE] ${message}`);
  }
  debug(message: string) {
    if (this.isVerbose) console.log(`[DEBUG] ${message}`);
  }
  silly(message: string) {
    if (this.isVerbose) console.log(`[SILLY] ${message}`);
  }
}

interface DeployError {
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  context?: Record<string, unknown>;
}

interface DeployResult {
  success: boolean;
  errors: DeployError[];
  rawOutput: string;
}

interface MetricError {
  metricName: string;
  errorMessage: string;
  originalDax?: string;
  file?: string;
}

/**
 * Initialize output directory as a git repo with remote origin
 * (Required by SML CLI for deploy)
 */
async function initGitRepo(outputDir: string): Promise<void> {
  // Check if .git already exists
  const gitDir = path.join(outputDir, ".git");
  try {
    await fs.access(gitDir);
    return; // Already initialized
  } catch {
    // Need to initialize
  }

  execSync("git init", { cwd: outputDir, stdio: "pipe" });
  execSync('git config user.email "deploy-test@localhost"', {
    cwd: outputDir,
    stdio: "pipe",
  });
  execSync('git config user.name "Deploy Test"', {
    cwd: outputDir,
    stdio: "pipe",
  });

  // Add a remote origin (SML CLI requires this)
  execSync(
    'git remote add origin https://github.com/test/sml-deploy-test.git',
    { cwd: outputDir, stdio: "pipe" }
  );

  // Create initial commit
  execSync("git add -A", { cwd: outputDir, stdio: "pipe" });
  execSync('git commit -m "Initial SML output" --allow-empty', {
    cwd: outputDir,
    stdio: "pipe",
  });
}

/**
 * Convert BIM to SML
 */
async function convertBimToSml(
  inputFile: string,
  outputDir: string,
  logger: Logger
): Promise<void> {
  const parser = BimFileParser.create(logger);
  const bim = await parser.parseFile(inputFile);

  const converter = new BimToYamlConverter(logger);
  const result = await converter.convert(bim, "Snowflake");

  const writer = SmlResultWriter.create(logger);
  await writer.persist(outputDir, result);
}

/**
 * Parse SML CLI output for errors
 */
function parseCliOutput(output: string): DeployError[] {
  const errors: DeployError[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Match [ERROR] or [WARNING] prefixed lines
    const severityMatch = trimmed.match(/^\[(ERROR|WARNING|INFO)\]\s*(.+)$/i);
    if (severityMatch) {
      const severity = severityMatch[1].toLowerCase() as DeployError["severity"];
      let message = severityMatch[2];

      // Try to extract context if present
      let context: Record<string, unknown> | undefined;
      const contextMatch = message.match(/\(Context:\s*(.+)\)$/);
      if (contextMatch) {
        try {
          context = JSON.parse(contextMatch[1]);
          message = message.replace(contextMatch[0], "").trim();
        } catch {
          // Not valid JSON, keep as is
        }
      }

      errors.push({ severity, message, context });
    }
  }

  return errors;
}

/**
 * Deploy SML to AtScale using SML CLI
 */
async function deployToAtScale(
  outputDir: string,
  smlCliPath: string
): Promise<DeployResult> {
  // Check required env vars
  const apiUrl = process.env.ATSCALE_API_URL;
  const apiToken = process.env.ATSCALE_API_TOKEN;

  if (!apiUrl || !apiToken) {
    return {
      success: false,
      errors: [
        {
          severity: "error",
          message:
            "Missing required environment variables: ATSCALE_API_URL and/or ATSCALE_API_TOKEN",
        },
      ],
      rawOutput: "",
    };
  }

  // Initialize git repo (required by SML CLI)
  await initGitRepo(outputDir);

  // Run SML CLI deploy command
  const result = spawnSync(smlCliPath, ["deploy", outputDir], {
    encoding: "utf-8",
    env: {
      ...process.env,
      ATSCALE_API_URL: apiUrl,
      ATSCALE_API_TOKEN: apiToken,
    },
    shell: true,
  });

  const rawOutput = (result.stdout || "") + "\n" + (result.stderr || "");
  const errors = parseCliOutput(rawOutput);

  // Also check for ResponseError format in output
  if (rawOutput.includes("Status:") && rawOutput.includes("Message:")) {
    const statusMatch = rawOutput.match(/Status:\s*(\d+)\s*(.+)/);
    const messageMatch = rawOutput.match(/Message:\s*(.+)/s);
    if (statusMatch || messageMatch) {
      errors.push({
        severity: "error",
        message: `API Error: ${statusMatch?.[0] || ""} ${messageMatch?.[1] || ""}`.trim(),
      });
    }
  }

  return {
    success: result.status === 0 && errors.filter((e) => e.severity === "error").length === 0,
    errors,
    rawOutput,
  };
}

/**
 * Extract metric-specific errors with original DAX from SML files
 */
async function enrichErrorsWithDax(
  errors: DeployError[],
  outputDir: string
): Promise<MetricError[]> {
  const metricErrors: MetricError[] = [];

  for (const error of errors) {
    if (error.severity !== "error") continue;

    const metricError: MetricError = {
      metricName: "unknown",
      errorMessage: error.message,
      file: error.file,
    };

    // Try to extract metric name from context or message
    if (error.context) {
      const ctx = error.context as Record<string, string>;
      if (ctx.metric) metricError.metricName = ctx.metric;
      if (ctx.unique_name) metricError.metricName = ctx.unique_name;
      if (ctx.name) metricError.metricName = ctx.name;
    }

    // Try to find metric name in error message
    const metricMatch = error.message.match(/metric[:\s]+['"]?([^'":\s]+)['"]?/i);
    if (metricMatch && metricError.metricName === "unknown") {
      metricError.metricName = metricMatch[1];
    }

    metricErrors.push(metricError);
  }

  return metricErrors;
}

function printSummary(
  inputFile: string,
  deployResult: DeployResult,
  metricErrors: MetricError[]
): void {
  console.log("\n" + "=".repeat(60));
  console.log("Deploy Test Summary");
  console.log("=".repeat(60));
  console.log(`Input: ${inputFile}`);

  const errorCount = deployResult.errors.filter((e) => e.severity === "error").length;
  const warningCount = deployResult.errors.filter((e) => e.severity === "warning").length;

  console.log(`\n--- Results ---`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Warnings: ${warningCount}`);
  console.log(`  Success: ${deployResult.success ? "YES" : "NO"}`);

  if (errorCount > 0) {
    console.log(`\n--- Errors ---`);
    for (const error of deployResult.errors.filter((e) => e.severity === "error")) {
      console.log(`  - ${error.message}`);
      if (error.context) {
        console.log(`    Context: ${JSON.stringify(error.context)}`);
      }
    }
  }

  if (metricErrors.length > 0) {
    console.log(`\n--- Metric Errors (${metricErrors.length}) ---`);
    for (const me of metricErrors) {
      console.log(`  Metric: ${me.metricName}`);
      console.log(`    Error: ${me.errorMessage}`);
      if (me.originalDax) {
        console.log(`    DAX: ${me.originalDax.substring(0, 100)}...`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`RESULT: ${deployResult.success ? "PASS" : "FAIL"}`);
}

async function main() {
  const args = process.argv.slice(2);

  // Default input file
  let inputFile = path.join(process.cwd(), "test-files", "pbi_dw_test_model.bim");
  let outputDir: string | undefined;
  let smlCliPath = "/Users/dianne/go/src/github.com/AtScaleInc/SML/apps/cli/bin/dev.js";
  let outputErrorsFile: string | undefined;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && i + 1 < args.length) {
      inputFile = args[++i];
    } else if (args[i] === "--output" && i + 1 < args.length) {
      outputDir = args[++i];
    } else if (args[i] === "--sml-cli" && i + 1 < args.length) {
      smlCliPath = args[++i];
    } else if (args[i] === "--output-errors" && i + 1 < args.length) {
      outputErrorsFile = args[++i];
    } else if (args[i] === "--verbose" || args[i] === "-v") {
      verbose = true;
    }
  }

  // Check input file exists
  try {
    await fs.access(inputFile);
  } catch {
    console.error(`Error: Input file not found: ${inputFile}`);
    console.error("\nUsage: npm run deploy-test -- [--input <file.bim>] [--output <dir>] [--output-errors <file.json>] [--verbose]");
    process.exit(1);
  }

  // Default output directory
  if (!outputDir) {
    outputDir = `/tmp/sml-deploy-test-${Date.now()}`;
  }

  // Ensure output dir exists
  await fs.mkdir(outputDir, { recursive: true });

  const logger = new DeployLogger(verbose);
  console.log(`Converting: ${path.basename(inputFile)}`);
  console.log(`Output: ${outputDir}`);

  // Step 1: Convert BIM to SML
  console.log("\n[1/2] Converting BIM to SML...");
  try {
    await convertBimToSml(inputFile, outputDir, logger);
    console.log("  Conversion complete.");
  } catch (error) {
    console.error(`  Conversion failed: ${error}`);
    process.exit(1);
  }

  // Step 2: Deploy to AtScale
  console.log("\n[2/2] Deploying to AtScale...");
  const deployResult = await deployToAtScale(outputDir, smlCliPath);

  if (verbose) {
    console.log("\n--- Raw Output ---");
    console.log(deployResult.rawOutput);
  }

  // Enrich errors with metric info
  const metricErrors = await enrichErrorsWithDax(deployResult.errors, outputDir);

  // Print summary
  printSummary(inputFile, deployResult, metricErrors);

  // Save errors to file if requested
  if (outputErrorsFile) {
    const errorData = {
      timestamp: new Date().toISOString(),
      inputFile,
      outputDir,
      success: deployResult.success,
      errors: deployResult.errors,
      metricErrors,
      rawOutput: deployResult.rawOutput,
    };
    await fs.writeFile(outputErrorsFile, JSON.stringify(errorData, null, 2));
    console.log(`\nErrors saved to: ${outputErrorsFile}`);
  }

  // Cleanup temp output if not specified
  if (outputDir.startsWith("/tmp/sml-deploy-test-")) {
    await fs.rm(outputDir, { recursive: true, force: true });
  }

  // Exit with error if deploy failed
  if (!deployResult.success) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
