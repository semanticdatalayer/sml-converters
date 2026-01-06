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
      if (line.toLowerCase().includes("error")) {
        errors.push(line.trim());
      } else if (line.toLowerCase().includes("warning")) {
        warnings.push(line.trim());
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
      if (trimmed && trimmed.toLowerCase().includes("error")) {
        errors.push(trimmed);
      } else if (trimmed && trimmed.toLowerCase().includes("warning")) {
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
