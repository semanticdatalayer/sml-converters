#!/usr/bin/env tsx
/**
 * Custom Calculations Test Runner
 *
 * Converts a BIM file to SML, validates output, and reports conversion summary.
 * Default input: test-files/dw_test_model.bim
 *
 * Usage:
 *   npm run test-custom-calcs
 *   npm run test-custom-calcs -- --input ./path/to/file.bim
 *   npm run test-custom-calcs -- --verbose
 */

import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { BimFileParser } from "../src/commands/bim-to-sml/bim-file-parser";
import { BimToYamlConverter } from "../src/commands/bim-to-sml/bim-converter/bim-to-sml-converter";
import { SmlConverterResult } from "../src/shared/sml-convert-result";
import { SmlResultWriter } from "../src/shared/sml-result-writer";
import { Logger } from "../src/shared/logger";

// Simple logger implementation
class TestLogger implements Logger {
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

interface ValidationResult {
  success: boolean;
  output: string;
  errors: string[];
}

interface TodoBreakdown {
  "x-agg": number;
  filter: number;
  time: number;
  selected: number;
  relationship: number;
  calculate: number;
  calculationgroup: number;
  other: number;
}

/**
 * Categorize TODO expression by ALL matching categories (multi-category)
 */
function categorizeTodoFunctionMulti(expr: string): string[] {
  const upperExpr = expr.toUpperCase();
  const categories: string[] = [];

  // calculationgroup: measures that use calculation groups (check first - exclusive category)
  if (expr.includes("TODO uses calculationgroup")) {
    categories.push("calculationgroup");
    return categories; // calc group TODOs don't need other categorization
  }

  // x-agg: iteration functions
  if (
    /SUMX\b/.test(upperExpr) ||
    /AVERAGEX\b/.test(upperExpr) ||
    /COUNTX\b/.test(upperExpr) ||
    /MINX\b/.test(upperExpr) ||
    /MAXX\b/.test(upperExpr) ||
    /PRODUCTX\b/.test(upperExpr) ||
    /CONCATENATEX\b/.test(upperExpr) ||
    /RANKX\b/.test(upperExpr) ||
    /COUNTAX\b/.test(upperExpr)
  ) {
    categories.push("x-agg");
  }

  // filter: filter context functions
  if (
    /FILTER\b/.test(upperExpr) ||
    /ISFILTERED\b/.test(upperExpr) ||
    /ISCROSSFILTERED\b/.test(upperExpr) ||
    /REMOVEFILTERS\b/.test(upperExpr) ||
    /ALLEXCEPT\b/.test(upperExpr) ||
    /KEEPFILTERS\b/.test(upperExpr) ||
    /USERELATIONSHIP\b/.test(upperExpr)
  ) {
    categories.push("filter");
  }

  // time: time intelligence functions
  if (
    /TOTALYTD\b/.test(upperExpr) ||
    /TOTALQTD\b/.test(upperExpr) ||
    /TOTALMTD\b/.test(upperExpr) ||
    /SAMEPERIODLASTYEAR\b/.test(upperExpr) ||
    /PARALLELPERIOD\b/.test(upperExpr) ||
    /DATEADD\b/.test(upperExpr) ||
    /DATESYTD\b/.test(upperExpr) ||
    /DATESQTD\b/.test(upperExpr) ||
    /DATESMTD\b/.test(upperExpr) ||
    /DATESBETWEEN\b/.test(upperExpr) ||
    /DATESINPERIOD\b/.test(upperExpr) ||
    /PREVIOUSYEAR\b/.test(upperExpr) ||
    /PREVIOUSQUARTER\b/.test(upperExpr) ||
    /PREVIOUSMONTH\b/.test(upperExpr) ||
    /PREVIOUSDAY\b/.test(upperExpr) ||
    /NEXTYEAR\b/.test(upperExpr) ||
    /NEXTQUARTER\b/.test(upperExpr) ||
    /NEXTMONTH\b/.test(upperExpr) ||
    /NEXTDAY\b/.test(upperExpr) ||
    /STARTOFYEAR\b/.test(upperExpr) ||
    /STARTOFQUARTER\b/.test(upperExpr) ||
    /STARTOFMONTH\b/.test(upperExpr) ||
    /ENDOFYEAR\b/.test(upperExpr) ||
    /ENDOFQUARTER\b/.test(upperExpr) ||
    /ENDOFMONTH\b/.test(upperExpr) ||
    /CLOSINGBALANCEMONTH\b/.test(upperExpr) ||
    /OPENINGBALANCEMONTH\b/.test(upperExpr)
  ) {
    categories.push("time");
  }

  // selected: selection context functions
  if (
    /SELECTEDVALUE\b/.test(upperExpr) ||
    /HASONEVALUE\b/.test(upperExpr) ||
    /ALLSELECTED\b/.test(upperExpr) ||
    /ISINSCOPE\b/.test(upperExpr) ||
    /SELECTEDMEASURE\b/.test(upperExpr) ||
    /ISSELECTEDMEASURE\b/.test(upperExpr)
  ) {
    categories.push("selected");
  }

  // relationship: relationship and table functions
  if (
    /RELATED\b/.test(upperExpr) ||
    /LOOKUPVALUE\b/.test(upperExpr) ||
    /PATH\b/.test(upperExpr) ||
    /VALUES\b/.test(upperExpr) ||
    /DISTINCT\b/.test(upperExpr) ||
    /CROSSJOIN\b/.test(upperExpr) ||
    /CURRENTGROUP\b/.test(upperExpr) ||
    /GROUPBY\b/.test(upperExpr) ||
    /NATURALINNERJOIN\b/.test(upperExpr) ||
    /NATURALLEFTOUTERJOIN\b/.test(upperExpr) ||
    /INTERSECT\b/.test(upperExpr) ||
    /UNION\b/.test(upperExpr) ||
    /EXCEPT\b/.test(upperExpr)
  ) {
    categories.push("relationship");
  }

  // calculate: CALCULATE/CALCULATETABLE
  if (
    /CALCULATE\b/.test(upperExpr) ||
    /CALCULATETABLE\b/.test(upperExpr)
  ) {
    categories.push("calculate");
  }

  // If no categories matched, it's "other"
  if (categories.length === 0) {
    categories.push("other");
  }

  return categories;
}

/**
 * Analyzes TODO expressions allowing multiple categories per calc
 */
function analyzeTodosByAllCategories(result: SmlConverterResult): TodoBreakdown {
  const categories: TodoBreakdown = {
    "x-agg": 0,
    filter: 0,
    time: 0,
    selected: 0,
    relationship: 0,
    calculate: 0,
    calculationgroup: 0,
    other: 0,
  };

  for (const metric of result.measuresCalculated) {
    const expr = metric.expression || "";
    if (expr.includes("TODO")) {
      const matchedCategories = categorizeTodoFunctionMulti(expr);
      for (const category of matchedCategories) {
        categories[category as keyof TodoBreakdown]++;
      }
    }
  }

  return categories;
}

function analyzeMetricCalcs(result: SmlConverterResult) {
  const total = result.measuresCalculated.length;

  let todoCount = 0;
  let mdxCount = 0;

  for (const metric of result.measuresCalculated) {
    const expr = metric.expression || "";

    if (expr.includes("TODO") || expr.includes("Original DAX")) {
      todoCount++;
    } else if (expr.trim().length > 0) {
      mdxCount++;
    } else {
      todoCount++;
    }
  }

  return {
    total,
    mdx_converted: mdxCount,
    todo_remaining: todoCount,
    conversion_rate: total > 0 ? Math.round((mdxCount / total) * 100) : 0,
    todo_by_function_multi: analyzeTodosByAllCategories(result),
  };
}

async function convertBimFile(
  filePath: string,
  outputDir: string,
  logger: Logger,
): Promise<{ result: SmlConverterResult; duration: number } | { error: string; duration: number }> {
  const startTime = Date.now();

  try {
    const parser = BimFileParser.create(logger);
    const bim = await parser.parseFile(filePath);

    const converter = new BimToYamlConverter(logger);
    const result = await converter.convert(bim, "Postgres");

    // Write SML output
    const writer = SmlResultWriter.create(logger);
    await writer.persist(outputDir, result);

    const duration = Date.now() - startTime;
    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
}

async function validateSmlOutput(
  outputDir: string,
  smlCliPath: string,
): Promise<ValidationResult> {
  try {
    const output = execSync(
      `${smlCliPath} validate ${outputDir}`,
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        shell: "/bin/bash",
      }
    );

    const errors: string[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^\[ERROR\]|error.*detected|contains.*error/i) && !trimmed.toLowerCase().includes("no errors")) {
        errors.push(trimmed);
      }
    }

    return {
      success: errors.length === 0,
      output,
      errors,
    };
  } catch (error: any) {
    const stderr = error.stderr?.toString() || "";
    const stdout = error.stdout?.toString() || "";
    const combined = stdout + "\n" + stderr;

    const errors: string[] = [];

    for (const line of combined.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && trimmed.match(/^\[ERROR\]|error.*detected|contains.*error/i) && !trimmed.toLowerCase().includes("no errors")) {
        errors.push(trimmed);
      }
    }

    if (errors.length === 0) {
      errors.push(error.message || "Validation failed");
    }

    return {
      success: false,
      output: combined,
      errors,
    };
  }
}

function printSummary(
  fileName: string,
  details: ReturnType<typeof analyzeMetricCalcs>,
  validation: ValidationResult,
  duration: number,
) {
  console.log("\n" + "=".repeat(60));
  console.log("Custom Calculations Test Summary");
  console.log("=".repeat(60));
  console.log(`File: ${fileName}`);
  console.log(`Duration: ${duration}ms`);

  console.log("\n--- Conversion Results ---");
  console.log(`  Total Calculated Metrics: ${details.total}`);
  console.log(`  MDX Converted: ${details.mdx_converted}`);
  console.log(`  TODO Remaining: ${details.todo_remaining}`);
  console.log(`  Overall Conversion Rate: ${details.conversion_rate}%`);

  if (details.todo_remaining > 0) {
    const todoTotal = details.todo_remaining;
    const funcs = details.todo_by_function_multi;

    console.log(`\n--- Overall TODO Breakdown by All Functions (multi-category, totals > 100%): ---`);
    console.log(`  Calculation Group: ${funcs.calculationgroup} (${Math.round((funcs.calculationgroup / todoTotal) * 100)}%)`);
    console.log(`  X-Agg (SUMX, AVERAGEX, etc): ${funcs["x-agg"]} (${Math.round((funcs["x-agg"] / todoTotal) * 100)}%)`);
    console.log(`  Filter (FILTER, ISFILTERED, etc): ${funcs.filter} (${Math.round((funcs.filter / todoTotal) * 100)}%)`);
    console.log(`  Time Intelligence: ${funcs.time} (${Math.round((funcs.time / todoTotal) * 100)}%)`);
    console.log(`  Selection Context: ${funcs.selected} (${Math.round((funcs.selected / todoTotal) * 100)}%)`);
    console.log(`  Relationship (RELATED, VALUES, etc): ${funcs.relationship} (${Math.round((funcs.relationship / todoTotal) * 100)}%)`);
    console.log(`  CALCULATE/CALCULATETABLE: ${funcs.calculate} (${Math.round((funcs.calculate / todoTotal) * 100)}%)`);
    console.log(`  Other: ${funcs.other} (${Math.round((funcs.other / todoTotal) * 100)}%)`);
  }

  console.log("\n--- Validation ---");
  if (validation.success) {
    console.log("  ✓ SML Validation PASSED");
  } else {
    console.log("  ✗ SML Validation FAILED");
    for (const error of validation.errors) {
      console.log(`    - ${error}`);
    }
  }

  console.log("\n" + "=".repeat(60));

  // Final status
  if (validation.success) {
    console.log("RESULT: PASS");
  } else {
    console.log("RESULT: FAIL");
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Default to test-files/dw_test_model.bim
  let inputFile = path.join(process.cwd(), "test-files", "dw_test_model.bim");
  let outputDir: string | undefined;
  let smlCliPath = "/usr/local/bin/sml-cli";
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && i + 1 < args.length) {
      inputFile = args[++i];
    } else if (args[i] === "--output" && i + 1 < args.length) {
      outputDir = args[++i];
    } else if (args[i] === "--sml-cli" && i + 1 < args.length) {
      smlCliPath = args[++i];
    } else if (args[i] === "--verbose" || args[i] === "-v") {
      verbose = true;
    }
  }

  // Check if input file exists
  try {
    await fs.access(inputFile);
  } catch {
    console.error(`Error: Input file not found: ${inputFile}`);
    console.error("\nUsage: npm run test-custom-calcs -- [--input <file.bim>] [--output <dir>] [--verbose]");
    process.exit(1);
  }

  // Default output directory (temp)
  if (!outputDir) {
    outputDir = `/tmp/sml-custom-test-${Date.now()}`;
  }

  const logger = new TestLogger(verbose);
  const fileName = path.basename(inputFile);

  console.log(`Converting: ${fileName}`);
  if (verbose) {
    console.log(`Output: ${outputDir}`);
  }

  // Convert BIM to SML
  const conversionResult = await convertBimFile(inputFile, outputDir, logger);

  if ("error" in conversionResult) {
    console.error(`\n✗ Conversion FAILED: ${conversionResult.error}`);
    process.exit(1);
  }

  const { result, duration } = conversionResult;

  // Analyze metrics
  const details = analyzeMetricCalcs(result);

  // Validate SML
  const validation = await validateSmlOutput(outputDir, smlCliPath);

  // Print summary
  printSummary(fileName, details, validation, duration);

  // Cleanup temp output if not specified
  if (outputDir.startsWith("/tmp/sml-custom-test-")) {
    await fs.rm(outputDir, { recursive: true, force: true });
  }

  // Exit with error if validation failed
  if (!validation.success) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
