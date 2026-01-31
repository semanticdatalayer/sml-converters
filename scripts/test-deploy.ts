#!/usr/bin/env tsx
/**
 * Test Deploy Script
 *
 * Converts a BIM file to SML, validates output, and deploys to AtScale.
 * Wraps the pbi-deploy script from the SML test suite.
 *
 * Usage:
 *   npm run test-deploy -- <bim-file-path>
 *   npm run test-deploy -- /path/to/file_bim.json
 *   npm run test-deploy -- /path/to/file_bim.json --keep
 *   npm run test-deploy -- /path/to/directory
 *
 * Options:
 *   --keep    Keep deployed catalogs (don't undeploy after completion)
 *
 * Prerequisites:
 *   - Environment variables configured in SML test directory (.env file)
 *   - ATSCALE_API_URL, ATSCALE_API_KC_* variables for authentication
 *   - SNOWFLAKE_DATABASE, SNOWFLAKE_SCHEMA for connection patching
 *
 * Example:
 *   npm run test-deploy -- /Users/dianne/Downloads/bim/tests1/FactPolicyLine_bim.json
 *   npm run test-deploy -- /Users/dianne/Downloads/bim/tests1/ --keep
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

// Path to the SML test directory containing pbi-deploy script
const SML_TEST_DIR = "/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter";

interface TestDeployResult {
  success: boolean;
  inputPath: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}

function printUsage(): void {
  console.log(`
Test Deploy Script - Convert BIM to SML and deploy to AtScale

Usage:
  npm run test-deploy -- <bim-file-or-directory> [--keep]

Arguments:
  bim-file-or-directory    Path to .bim/.json file or directory containing BIM files

Options:
  --keep                   Keep deployed catalogs (don't undeploy after completion)

Examples:
  npm run test-deploy -- /path/to/model_bim.json
  npm run test-deploy -- /path/to/bim-directory --keep
`);
}

function validateInputPath(inputPath: string): { valid: boolean; resolvedPath?: string; error?: string } {
  const resolvedPath = path.resolve(inputPath);

  if (!fs.existsSync(resolvedPath)) {
    return { valid: false, error: `Path does not exist: ${resolvedPath}` };
  }

  const stat = fs.statSync(resolvedPath);

  if (stat.isFile()) {
    const ext = path.extname(resolvedPath).toLowerCase();
    if (ext !== ".bim" && ext !== ".json") {
      return { valid: false, error: `File must have .bim or .json extension: ${resolvedPath}` };
    }
    return { valid: true, resolvedPath };
  }

  if (stat.isDirectory()) {
    return { valid: true, resolvedPath };
  }

  return { valid: false, error: `Path is not a file or directory: ${resolvedPath}` };
}

function validateSmlTestDir(): boolean {
  if (!fs.existsSync(SML_TEST_DIR)) {
    console.error(`❌ SML test directory not found: ${SML_TEST_DIR}`);
    console.error(`   Please ensure the SML repository is cloned at the expected location.`);
    return false;
  }

  const packageJsonPath = path.join(SML_TEST_DIR, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`❌ SML test directory missing package.json: ${SML_TEST_DIR}`);
    return false;
  }

  return true;
}

function runPbiDeploy(inputPath: string, keepCatalogs: boolean): TestDeployResult {
  const args = ["pbi-deploy", inputPath];
  if (keepCatalogs) {
    args.push("--keep");
  }

  console.log(`\n📁 Input: ${inputPath}`);
  console.log(`📂 Working directory: ${SML_TEST_DIR}`);
  console.log(`🔧 Command: pnpm ${args.join(" ")}`);
  console.log(`🔒 Keep catalogs: ${keepCatalogs}\n`);

  const result = spawnSync("pnpm", args, {
    cwd: SML_TEST_DIR,
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "pipe"],
    env: {
      ...process.env,
      // Ensure pnpm uses correct node
      PATH: process.env.PATH,
    },
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const exitCode = result.status ?? 1;

  // Print output
  if (stdout) {
    console.log(stdout);
  }
  if (stderr && exitCode !== 0) {
    console.error(stderr);
  }

  return {
    success: exitCode === 0,
    inputPath,
    exitCode,
    stdout,
    stderr,
  };
}

function printResult(result: TestDeployResult): void {
  console.log("\n" + "=".repeat(60));
  console.log("TEST DEPLOY RESULT");
  console.log("=".repeat(60));
  console.log(`Input: ${result.inputPath}`);
  console.log(`Status: ${result.success ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Exit Code: ${result.exitCode}`);
  console.log("=".repeat(60) + "\n");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse arguments
  let inputPath: string | undefined;
  let keepCatalogs = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--keep") {
      keepCatalogs = true;
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      inputPath = arg;
    }
  }

  // Validate input
  if (!inputPath) {
    console.error("❌ Error: No input file or directory specified\n");
    printUsage();
    process.exit(1);
  }

  // Validate input path
  const validation = validateInputPath(inputPath);
  if (!validation.valid) {
    console.error(`❌ Error: ${validation.error}`);
    process.exit(1);
  }

  // Validate SML test directory exists
  if (!validateSmlTestDir()) {
    process.exit(1);
  }

  // Run pbi-deploy
  const result = runPbiDeploy(validation.resolvedPath!, keepCatalogs);

  // Print result
  printResult(result);

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
