#!/usr/bin/env tsx
/**
 * BIM Conversion Validator
 *
 * Converts single BIM file to SML, validates output, and reports results.
 * Use this to test SML generation quality after code changes.
 *
 * Usage:
 *   npm run validate-conversion -- --input ./path/to/file.bim
 *   npm run validate-conversion -- --input ./file.bim --output ./sml-output
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
  warnings: string[];
}

interface ConversionReport {
  file: string;
  conversion_success: boolean;
  conversion_error?: string;
  conversion_duration_ms: number;
  validation: ValidationResult;
  counts: {
    models: number;
    datasets: number;
    dimensions: number;
    metrics: number;
    metrics_calculated: number;
    relationships: number;
    connections: number;
  };
  metric_calc_details: {
    total: number;
    mdx_converted: number;
    todo_remaining: number;
    conversion_rate: number;
    by_category: {
      direct_conversion: number;
      template_conversion: number;
      var_inlined: number;
      ai_conversion: number;
      unconvertible: number;
    };
    todo_by_function: {
      "x-agg": number;
      filter: number;
      time: number;
      selected: number;
      relationship: number;
      calculate: number;
      other: number;
    };
    todo_by_function_multi: {
      "x-agg": number;
      filter: number;
      time: number;
      selected: number;
      relationship: number;
      calculate: number;
      other: number;
    };
  };
}

/**
 * Detects conversion category from metric expression
 */
function detectCategory(metric: any): string {
  const expr = metric.expression || "";

  if (!expr.trim() || expr.includes("TODO")) {
    return "unconvertible";
  }

  if (expr.includes("/* Converted via: direct_conversion */")) {
    return "direct_conversion";
  }
  if (expr.includes("/* Converted via: template_conversion */")) {
    return "template_conversion";
  }
  if (expr.includes("/* Converted via: var_inlined */")) {
    return "var_inlined";
  }
  if (expr.includes("/* Converted via: ai_conversion */")) {
    return "ai_conversion";
  }

  if (expr.includes("Original DAX")) {
    return "ai_conversion";
  }

  return "template_conversion";
}

/**
 * Categorizes unconvertible function in TODO expression
 * Only returns first category match
 */
function categorizeTodoFunction(expr: string): string {
  const upperExpr = expr.toUpperCase();

  // x-agg: iteration functions
  if (
    /SUMX\b/.test(upperExpr) ||
    /AVERAGEX\b/.test(upperExpr) ||
    /AVGX\b/.test(upperExpr) ||
    /MINX\b/.test(upperExpr) ||
    /MAXX\b/.test(upperExpr) ||
    /COUNTX\b/.test(upperExpr) ||
    /RANKX\b/.test(upperExpr)
  ) {
    return "x-agg";
  }

  // filter: filter context functions
  if (
    /FILTER\b/.test(upperExpr) ||
    /HASONEFILTER\b/.test(upperExpr) ||
    /ISFILTERED\b/.test(upperExpr) ||
    /KEEPFILTERS\b/.test(upperExpr) ||
    /REMOVEFILTERS\b/.test(upperExpr) ||
    /CROSSFILTER\b/.test(upperExpr) ||
    /ISCROSSFILTERED\b/.test(upperExpr)
  ) {
    return "filter";
  }

  // time: time intelligence functions
  if (
    /TOTALYTD\b/.test(upperExpr) ||
    /TOTALQTD\b/.test(upperExpr) ||
    /TOTALMTD\b/.test(upperExpr) ||
    /SAMEPERIODLASTYEAR\b/.test(upperExpr) ||
    /DATEADD\b/.test(upperExpr) ||
    /DATESBETWEEN\b/.test(upperExpr) ||
    /DATESINPERIOD\b/.test(upperExpr) ||
    /DATESYTD\b/.test(upperExpr) ||
    /DATESQTD\b/.test(upperExpr) ||
    /DATESMTD\b/.test(upperExpr) ||
    /PARALLELPERIOD\b/.test(upperExpr) ||
    /NEXTDAY\b/.test(upperExpr) ||
    /NEXTMONTH\b/.test(upperExpr) ||
    /NEXTQUARTER\b/.test(upperExpr) ||
    /NEXTYEAR\b/.test(upperExpr) ||
    /PREVIOUSDAY\b/.test(upperExpr) ||
    /PREVIOUSMONTH\b/.test(upperExpr) ||
    /PREVIOUSQUARTER\b/.test(upperExpr) ||
    /PREVIOUSYEAR\b/.test(upperExpr)
  ) {
    return "time";
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
    return "selected";
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
    return "relationship";
  }

  // calculate: CALCULATE/CALCULATETABLE (check if inside another function via TODO format)
  if (
    /CALCULATE\b/.test(upperExpr) ||
    /CALCULATETABLE\b/.test(upperExpr)
  ) {
    return "calculate";
  }

  return "other";
}

/**
 * Categorize TODO expression by ALL matching categories (multi-category)
 */
function categorizeTodoFunctionMulti(expr: string): string[] {
  const upperExpr = expr.toUpperCase();
  const categories: string[] = [];

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
    /ENDOFMONTH\b/.test(upperExpr)
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
 * Analyzes unconvertible TODO expressions by function category (single category per calc)
 */
function analyzeTodosByCategory(result: SmlConverterResult): Record<string, number> {
  const categories: Record<string, number> = {
    "x-agg": 0,
    "filter": 0,
    "time": 0,
    "selected": 0,
    "relationship": 0,
    "calculate": 0,
    "other": 0,
  };

  for (const metric of result.measuresCalculated) {
    const expr = metric.expression || "";
    if (expr.includes("TODO")) {
      const category = categorizeTodoFunction(expr);
      categories[category]++;
    }
  }

  return categories;
}

/**
 * Analyzes unconvertible TODO expressions allowing multiple categories per calc
 */
function analyzeTodosByAllCategories(result: SmlConverterResult): Record<string, number> {
  const categories: Record<string, number> = {
    "x-agg": 0,
    "filter": 0,
    "time": 0,
    "selected": 0,
    "relationship": 0,
    "calculate": 0,
    "other": 0,
  };

  for (const metric of result.measuresCalculated) {
    const expr = metric.expression || "";
    if (expr.includes("TODO")) {
      const matchedCategories = categorizeTodoFunctionMulti(expr);
      for (const category of matchedCategories) {
        categories[category]++;
      }
    }
  }

  return categories;
}

function analyzeMetricCalcs(result: SmlConverterResult) {
  const total = result.measuresCalculated.length;

  const categories = {
    direct_conversion: 0,
    template_conversion: 0,
    var_inlined: 0,
    ai_conversion: 0,
    unconvertible: 0,
  };

  let todoCount = 0;
  let mdxCount = 0;

  for (const metric of result.measuresCalculated) {
    const expr = metric.expression || "";
    const category = detectCategory(metric);

    categories[category as keyof typeof categories]++;

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
    by_category: categories,
    todo_by_function: analyzeTodosByCategory(result),
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
    const smlCliDir = path.dirname(path.dirname(smlCliPath)); // Go up to root dir

    // Run SML validation - pass the output directory, not catalog.yml
    const output = execSync(
      `cd ${smlCliDir} && ${smlCliPath} validate ${outputDir}`,
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        shell: "/bin/bash",
      }
    );

    // Parse output for errors/warnings
    const errors: string[] = [];
    const warnings: string[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      // Look for SML CLI error format: [ERROR] ... or "Calculated metric ... error"
      if (trimmed.match(/^\[ERROR\]|error.*detected|contains.*error/i) && !trimmed.toLowerCase().includes("no errors")) {
        errors.push(trimmed);
      } else if (trimmed.match(/^\[WARNING\]/i)) {
        warnings.push(trimmed);
      }
    }

    return {
      success: errors.length === 0,
      output,
      errors,
      warnings,
    };
  } catch (error: any) {
    // Command failed - parse stderr for errors
    const stderr = error.stderr?.toString() || "";
    const stdout = error.stdout?.toString() || "";
    const combined = stdout + "\n" + stderr;

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const line of combined.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && trimmed.match(/^\[ERROR\]|error.*detected|contains.*error/i) && !trimmed.toLowerCase().includes("no errors")) {
        errors.push(trimmed);
      } else if (trimmed && trimmed.match(/^\[WARNING\]/i)) {
        warnings.push(trimmed);
      }
    }

    // If no specific errors found, use general message
    if (errors.length === 0) {
      errors.push(error.message || "Validation failed");
    }

    return {
      success: false,
      output: combined,
      errors,
      warnings,
    };
  }
}

function printReport(report: ConversionReport) {
  console.log("\n=== BIM Conversion Validation Report ===");
  console.log(`File: ${report.file}`);
  console.log(`Conversion Duration: ${report.conversion_duration_ms}ms`);

  if (!report.conversion_success) {
    console.log(`\n❌ CONVERSION FAILED: ${report.conversion_error}`);
    return;
  }

  console.log(`\n✓ Conversion Success`);

  console.log(`\n--- SML Objects Generated ---`);
  console.log(`  Models: ${report.counts.models}`);
  console.log(`  Datasets: ${report.counts.datasets}`);
  console.log(`  Dimensions: ${report.counts.dimensions}`);
  console.log(`  Metrics: ${report.counts.metrics}`);
  console.log(`  Calculated Metrics: ${report.counts.metrics_calculated}`);
  console.log(`  Relationships: ${report.counts.relationships}`);
  console.log(`  Connections: ${report.counts.connections}`);

  if (report.metric_calc_details.total > 0) {
    const details = report.metric_calc_details;
    console.log(`\n--- Calculated Metrics Analysis ---`);
    console.log(`  Total: ${details.total}`);
    console.log(`  MDX Converted: ${details.mdx_converted}`);
    console.log(`  TODO Remaining: ${details.todo_remaining}`);
    console.log(`  Conversion Rate: ${details.conversion_rate}%`);

    console.log(`\n  Conversion Categories:`);
    console.log(`    Direct Conversion: ${details.by_category.direct_conversion}`);
    console.log(`    Template Conversion: ${details.by_category.template_conversion}`);
    console.log(`    VAR Inlined: ${details.by_category.var_inlined}`);
    console.log(`    AI Conversion: ${details.by_category.ai_conversion}`);
    console.log(`    Unconvertible: ${details.by_category.unconvertible}`);

    if (details.todo_remaining > 0) {
      const todoTotal = details.todo_remaining;

      console.log(`\n  TODO Breakdown by Primary Function (single category per calc):`);
      console.log(`    X-Agg (SUMX, AVERAGEX, etc): ${details.todo_by_function["x-agg"]} (${Math.round((details.todo_by_function["x-agg"] / todoTotal) * 100)}%)`);
      console.log(`    Filter (FILTER, ISFILTERED, etc): ${details.todo_by_function.filter} (${Math.round((details.todo_by_function.filter / todoTotal) * 100)}%)`);
      console.log(`    Time Intelligence: ${details.todo_by_function.time} (${Math.round((details.todo_by_function.time / todoTotal) * 100)}%)`);
      console.log(`    Selection Context: ${details.todo_by_function.selected} (${Math.round((details.todo_by_function.selected / todoTotal) * 100)}%)`);
      console.log(`    Relationship (RELATED, VALUES, etc): ${details.todo_by_function.relationship} (${Math.round((details.todo_by_function.relationship / todoTotal) * 100)}%)`);
      console.log(`    CALCULATE/CALCULATETABLE: ${details.todo_by_function.calculate} (${Math.round((details.todo_by_function.calculate / todoTotal) * 100)}%)`);
      console.log(`    Other: ${details.todo_by_function.other} (${Math.round((details.todo_by_function.other / todoTotal) * 100)}%)`);

      console.log(`\n  TODO Breakdown by All Functions (multi-category, totals > 100%):`);
      console.log(`    X-Agg (SUMX, AVERAGEX, etc): ${details.todo_by_function_multi["x-agg"]} (${Math.round((details.todo_by_function_multi["x-agg"] / todoTotal) * 100)}%)`);
      console.log(`    Filter (FILTER, ISFILTERED, etc): ${details.todo_by_function_multi.filter} (${Math.round((details.todo_by_function_multi.filter / todoTotal) * 100)}%)`);
      console.log(`    Time Intelligence: ${details.todo_by_function_multi.time} (${Math.round((details.todo_by_function_multi.time / todoTotal) * 100)}%)`);
      console.log(`    Selection Context: ${details.todo_by_function_multi.selected} (${Math.round((details.todo_by_function_multi.selected / todoTotal) * 100)}%)`);
      console.log(`    Relationship (RELATED, VALUES, etc): ${details.todo_by_function_multi.relationship} (${Math.round((details.todo_by_function_multi.relationship / todoTotal) * 100)}%)`);
      console.log(`    CALCULATE/CALCULATETABLE: ${details.todo_by_function_multi.calculate} (${Math.round((details.todo_by_function_multi.calculate / todoTotal) * 100)}%)`);
      console.log(`    Other: ${details.todo_by_function_multi.other} (${Math.round((details.todo_by_function_multi.other / todoTotal) * 100)}%)`);
    }
  }

  console.log(`\n--- SML Validation Results ---`);
  if (report.validation.success) {
    console.log(`  ✓ Validation Passed`);
  } else {
    console.log(`  ❌ Validation Failed`);
  }

  if (report.validation.warnings.length > 0) {
    console.log(`\n  Warnings (${report.validation.warnings.length}):`);
    for (const warning of report.validation.warnings) {
      console.log(`    ⚠ ${warning}`);
    }
  }

  if (report.validation.errors.length > 0) {
    console.log(`\n  Errors (${report.validation.errors.length}):`);
    for (const error of report.validation.errors) {
      console.log(`    ✗ ${error}`);
    }
  }

  console.log(`\n--- Full Validation Output ---`);
  console.log(report.validation.output);
}

async function main() {
  const args = process.argv.slice(2);

  let inputFile: string | undefined;
  let outputDir: string | undefined;
  let smlCliPath = "/Users/dianne/go/src/github.com/AtScaleInc/SML/apps/cli/bin/dev.js";
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

  if (!inputFile) {
    console.error(
      "Usage: npm run validate-conversion -- --input <file.bim> [--output <dir>] [--sml-cli <path>] [--verbose]"
    );
    console.error("\nDefault SML CLI path:", smlCliPath);
    process.exit(1);
  }

  // Default output directory
  if (!outputDir) {
    outputDir = path.join(path.dirname(inputFile), "sml-output-" + Date.now());
  }

  const logger = new TestLogger(verbose);
  const fileName = path.basename(inputFile);

  console.log(`Converting BIM file: ${fileName}`);
  console.log(`Output directory: ${outputDir}`);

  // Convert BIM to SML
  const conversionResult = await convertBimFile(inputFile, outputDir, logger);

  let report: ConversionReport;

  if ("error" in conversionResult) {
    report = {
      file: fileName,
      conversion_success: false,
      conversion_error: conversionResult.error,
      conversion_duration_ms: conversionResult.duration,
      validation: {
        success: false,
        output: "",
        errors: ["Conversion failed - validation skipped"],
        warnings: [],
      },
      counts: {
        models: 0,
        datasets: 0,
        dimensions: 0,
        metrics: 0,
        metrics_calculated: 0,
        relationships: 0,
        connections: 0,
      },
      metric_calc_details: {
        total: 0,
        mdx_converted: 0,
        todo_remaining: 0,
        conversion_rate: 0,
        by_category: {
          direct_conversion: 0,
          template_conversion: 0,
          var_inlined: 0,
          ai_conversion: 0,
          unconvertible: 0,
        },
        todo_by_function: {
          "x-agg": 0,
          filter: 0,
          time: 0,
          selected: 0,
          relationship: 0,
          calculate: 0,
          other: 0,
        },
      },
    };
  } else {
    const { result, duration } = conversionResult;

    // Count relationships
    const relationshipCount = result.models.reduce(
      (sum, model) => sum + (model.relationships?.length || 0),
      0
    );

    // Validate SML output
    console.log(`\nValidating SML output with: ${smlCliPath}`);
    const validation = await validateSmlOutput(outputDir, smlCliPath);

    report = {
      file: fileName,
      conversion_success: true,
      conversion_duration_ms: duration,
      validation,
      counts: {
        models: result.models.length,
        datasets: result.datasets.length,
        dimensions: result.dimensions.length,
        metrics: result.measures.length,
        metrics_calculated: result.measuresCalculated.length,
        relationships: relationshipCount,
        connections: result.connections.length,
      },
      metric_calc_details: analyzeMetricCalcs(result),
    };
  }

  printReport(report);

  // Exit with error if validation failed
  if (!report.conversion_success || !report.validation.success) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
