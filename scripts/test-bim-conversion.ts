#!/usr/bin/env tsx
/**
 * BIM Conversion Test Runner
 *
 * Converts directory of BIM files to SML and generates summary report.
 * Can compare against baseline to detect regressions.
 *
 * Usage:
 *   npm run test-conversion -- --input ./test-bim-files --output ./test-results.json
 *   npm run test-conversion -- --input ./test-bim-files --baseline ./baseline.json --diff ./diff.json
 */

import fs from "fs/promises";
import path from "path";
import { BimFileParser } from "../src/commands/bim-to-sml/bim-file-parser";
import { BimToYamlConverter } from "../src/commands/bim-to-sml/bim-converter/bim-to-sml-converter";
import { SmlConverterResult } from "../src/shared/sml-convert-result";
import { Logger } from "../src/shared/logger";

// Simple logger implementation for testing
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

interface ConversionSummary {
  file: string;
  success: boolean;
  error?: string;
  duration_ms?: number;
  counts: {
    models: number;
    datasets: number;
    dimensions: number;
    metrics: number;
    metrics_calculated: number;
    relationships: number;
    connections: number;
  };
  metric_calc_details?: {
    total: number;
    mdx_converted: number;
    todo_remaining: number;
    conversion_rate: number;
  };
}

interface TestReport {
  timestamp: string;
  input_directory: string;
  total_files: number;
  successful: number;
  failed: number;
  llm_enabled: boolean;
  summaries: ConversionSummary[];
}

interface DiffResult {
  file: string;
  changes: {
    field: string;
    baseline: number;
    current: number;
    diff: number;
    percent_change?: number;
  }[];
}

async function findBimFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".json") || entry.name.endsWith(".bim"))
      ) {
        files.push(fullPath);
      }
    }
  }

  await scan(directory);
  return files;
}

function analyzeMetricCalcs(
  result: SmlConverterResult,
): ConversionSummary["metric_calc_details"] {
  const total = result.measuresCalculated.length;
  if (total === 0) {
    return {
      total: 0,
      mdx_converted: 0,
      todo_remaining: 0,
      conversion_rate: 0,
    };
  }

  let todoCount = 0;
  let mdxCount = 0;

  for (const metric of result.measuresCalculated) {
    const expr = metric.expression || "";
    // Check if expression contains TODO comment (indicates AI conversion or placeholder)
    if (expr.includes("TODO") || expr.includes("Original DAX")) {
      todoCount++;
    } else if (expr.trim().length > 0) {
      // Has expression without TODO = successfully converted
      mdxCount++;
    } else {
      // Empty expression = TODO
      todoCount++;
    }
  }

  return {
    total,
    mdx_converted: mdxCount,
    todo_remaining: todoCount,
    conversion_rate: total > 0 ? Math.round((mdxCount / total) * 100) : 0,
  };
}

async function convertBimFile(
  filePath: string,
  logger: Logger,
  llmName?: string,
): Promise<ConversionSummary> {
  const startTime = Date.now();
  const fileName = path.basename(filePath);

  try {
    // Parse BIM file
    const parser = BimFileParser.create(logger);
    const bim = await parser.parseFile(filePath);

    // Convert to SML
    const converter = new BimToYamlConverter(logger);
    const result = await converter.convert(bim, "Postgres", llmName);

    const duration = Date.now() - startTime;

    // Count relationships from all models
    const relationshipCount = result.models.reduce((sum, model) => {
      return sum + (model.relationships?.length || 0);
    }, 0);

    const summary: ConversionSummary = {
      file: fileName,
      success: true,
      duration_ms: duration,
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

    return summary;
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      file: fileName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration_ms: duration,
      counts: {
        models: 0,
        datasets: 0,
        dimensions: 0,
        metrics: 0,
        metrics_calculated: 0,
        relationships: 0,
        connections: 0,
      },
    };
  }
}

function compareSummaries(
  baseline: ConversionSummary,
  current: ConversionSummary,
): DiffResult | null {
  if (!baseline.success || !current.success) {
    return null;
  }

  const changes: DiffResult["changes"] = [];

  // Compare counts
  for (const key of Object.keys(baseline.counts)) {
    const field = key as keyof ConversionSummary["counts"];
    const baseValue = baseline.counts[field];
    const currValue = current.counts[field];

    if (baseValue !== currValue) {
      const diff = currValue - baseValue;
      const percentChange =
        baseValue > 0 ? Math.round((diff / baseValue) * 100) : undefined;

      changes.push({
        field: `counts.${field}`,
        baseline: baseValue,
        current: currValue,
        diff,
        percent_change: percentChange,
      });
    }
  }

  // Compare metric calc details
  if (baseline.metric_calc_details && current.metric_calc_details) {
    const baseDetails = baseline.metric_calc_details;
    const currDetails = current.metric_calc_details;

    if (baseDetails.conversion_rate !== currDetails.conversion_rate) {
      changes.push({
        field: "metric_calc_details.conversion_rate",
        baseline: baseDetails.conversion_rate,
        current: currDetails.conversion_rate,
        diff: currDetails.conversion_rate - baseDetails.conversion_rate,
      });
    }
  }

  return changes.length > 0 ? { file: current.file, changes } : null;
}

function compareReports(
  baseline: TestReport,
  current: TestReport,
): DiffResult[] {
  const diffs: DiffResult[] = [];

  for (const currSummary of current.summaries) {
    const baseSummary = baseline.summaries.find(
      (s) => s.file === currSummary.file,
    );
    if (baseSummary) {
      const diff = compareSummaries(baseSummary, currSummary);
      if (diff) {
        diffs.push(diff);
      }
    }
  }

  return diffs;
}

function printReport(report: TestReport) {
  console.log("\n=== BIM Conversion Test Report ===");
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Input Directory: ${report.input_directory}`);
  console.log(`LLM Enabled: ${report.llm_enabled ? "Yes" : "No"}`);
  console.log(`\nFiles Processed: ${report.total_files}`);
  console.log(`  Success: ${report.successful}`);
  console.log(`  Failed: ${report.failed}`);

  console.log("\n--- Per-File Summary ---");
  for (const summary of report.summaries) {
    console.log(`\n${summary.file}:`);
    if (!summary.success) {
      console.log(`  ❌ FAILED: ${summary.error}`);
      continue;
    }

    console.log(`  ✓ Duration: ${summary.duration_ms}ms`);
    console.log(`  Objects:`);
    console.log(`    Models: ${summary.counts.models}`);
    console.log(`    Datasets: ${summary.counts.datasets}`);
    console.log(`    Dimensions: ${summary.counts.dimensions}`);
    console.log(`    Metrics: ${summary.counts.metrics}`);
    console.log(`    Calculated Metrics: ${summary.counts.metrics_calculated}`);
    console.log(`    Relationships: ${summary.counts.relationships}`);
    console.log(`    Connections: ${summary.counts.connections}`);

    if (summary.metric_calc_details && summary.metric_calc_details.total > 0) {
      const details = summary.metric_calc_details;
      console.log(`  Calculated Metrics Detail:`);
      console.log(`    Total: ${details.total}`);
      console.log(`    MDX Converted: ${details.mdx_converted}`);
      console.log(`    TODO Remaining: ${details.todo_remaining}`);
      console.log(`    Conversion Rate: ${details.conversion_rate}%`);
    }
  }
}

function printDiff(diffs: DiffResult[]) {
  if (diffs.length === 0) {
    console.log("\n✓ No differences from baseline");
    return;
  }

  console.log("\n=== Differences from Baseline ===");
  for (const diff of diffs) {
    console.log(`\n${diff.file}:`);
    for (const change of diff.changes) {
      const sign = change.diff > 0 ? "+" : "";
      const pct =
        change.percent_change !== undefined
          ? ` (${sign}${change.percent_change}%)`
          : "";
      console.log(
        `  ${change.field}: ${change.baseline} → ${change.current} (${sign}${change.diff}${pct})`,
      );
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let inputDir: string | undefined;
  let outputFile: string | undefined;
  let baselineFile: string | undefined;
  let diffFile: string | undefined;
  let llmName: string | undefined;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && i + 1 < args.length) {
      inputDir = args[++i];
    } else if (args[i] === "--output" && i + 1 < args.length) {
      outputFile = args[++i];
    } else if (args[i] === "--baseline" && i + 1 < args.length) {
      baselineFile = args[++i];
    } else if (args[i] === "--diff" && i + 1 < args.length) {
      diffFile = args[++i];
    } else if (args[i] === "--llm" && i + 1 < args.length) {
      llmName = args[++i];
    } else if (args[i] === "--verbose" || args[i] === "-v") {
      verbose = true;
    }
  }

  if (!inputDir) {
    console.error(
      "Usage: npm run test-conversion -- --input <directory> [--output <file.json>] [--baseline <file.json>] [--diff <file.json>] [--llm openai|anthropic] [--verbose]",
    );
    process.exit(1);
  }

  // Create logger
  const logger = new TestLogger(verbose);

  console.log(`Scanning for BIM files in: ${inputDir}`);
  const bimFiles = await findBimFiles(inputDir);

  if (bimFiles.length === 0) {
    console.error("No BIM files found in input directory");
    process.exit(1);
  }

  console.log(`Found ${bimFiles.length} BIM file(s)`);

  const summaries: ConversionSummary[] = [];

  for (const filePath of bimFiles) {
    console.log(`\nProcessing: ${path.basename(filePath)}`);
    const summary = await convertBimFile(filePath, logger, llmName);
    summaries.push(summary);

    if (summary.success) {
      console.log(`  ✓ Success (${summary.duration_ms}ms)`);
    } else {
      console.log(`  ❌ Failed: ${summary.error}`);
    }
  }

  const report: TestReport = {
    timestamp: new Date().toISOString(),
    input_directory: inputDir,
    total_files: bimFiles.length,
    successful: summaries.filter((s) => s.success).length,
    failed: summaries.filter((s) => !s.success).length,
    llm_enabled: !!llmName,
    summaries,
  };

  // Print report to console
  printReport(report);

  // Save report to file if specified
  if (outputFile) {
    await fs.writeFile(outputFile, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${outputFile}`);
  }

  // Compare to baseline if specified
  if (baselineFile) {
    try {
      const baselineContent = await fs.readFile(baselineFile, "utf-8");
      const baseline: TestReport = JSON.parse(baselineContent);

      const diffs = compareReports(baseline, report);
      printDiff(diffs);

      // Save diff to file if specified
      if (diffFile && diffs.length > 0) {
        await fs.writeFile(diffFile, JSON.stringify(diffs, null, 2));
        console.log(`\nDiff saved to: ${diffFile}`);
      }

      // Exit with error code if there are differences
      if (diffs.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(`Failed to read baseline file: ${error}`);
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
