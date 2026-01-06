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
    by_category?: {
      direct_conversion: number;
      template_conversion: number;
      var_inlined: number;
      ai_conversion: number;
      unconvertible: number;
    };
    todo_by_function?: {
      "x-agg": number;
      filter: number;
      time: number;
      selected: number;
      relationship: number;
      calculate: number;
      other: number;
    };
    todo_by_function_multi?: {
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

/**
 * Detects the conversion category for a metric based on its expression
 */
function detectCategory(metric: any): string {
  const expr = metric.expression || "";

  // Empty or TODO = unconvertible
  if (!expr.trim() || expr.includes("TODO")) {
    return "unconvertible";
  }

  // Check for metadata comment added by pipeline
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

  // AI conversion (has "Original DAX" comment) - legacy detection
  if (expr.includes("Original DAX")) {
    return "ai_conversion";
  }

  // No metadata found - fallback to template (from older conversions)
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

  // calculate: CALCULATE/CALCULATETABLE
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
    /AVGX\b/.test(upperExpr) ||
    /MINX\b/.test(upperExpr) ||
    /MAXX\b/.test(upperExpr) ||
    /COUNTX\b/.test(upperExpr) ||
    /RANKX\b/.test(upperExpr)
  ) {
    categories.push("x-agg");
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
    categories.push("filter");
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
      by_category: {
        direct_conversion: 0,
        template_conversion: 0,
        var_inlined: 0,
        ai_conversion: 0,
        unconvertible: 0,
      },
    };
  }

  let todoCount = 0;
  let mdxCount = 0;

  // Category counters
  const categories = {
    direct_conversion: 0,
    template_conversion: 0,
    var_inlined: 0,
    ai_conversion: 0,
    unconvertible: 0,
  };

  for (const metric of result.measuresCalculated) {
    const expr = metric.expression || "";
    const category = detectCategory(metric);

    // Increment category counter
    categories[category as keyof typeof categories]++;

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
    by_category: categories,
    todo_by_function: analyzeTodosByCategory(result),
    todo_by_function_multi: analyzeTodosByAllCategories(result),
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

  // Aggregate TODO breakdown across all files
  const aggregateTodoByFunction: Record<string, number> = {
    "x-agg": 0,
    filter: 0,
    time: 0,
    selected: 0,
    relationship: 0,
    calculate: 0,
    other: 0,
  };

  const aggregateTodoByFunctionMulti: Record<string, number> = {
    "x-agg": 0,
    filter: 0,
    time: 0,
    selected: 0,
    relationship: 0,
    calculate: 0,
    other: 0,
  };

  let totalTodos = 0;
  let totalCalcs = 0;
  let totalMdxConverted = 0;

  for (const summary of report.summaries) {
    if (summary.success && summary.metric_calc_details) {
      const details = summary.metric_calc_details;
      totalCalcs += details.total;
      totalMdxConverted += details.mdx_converted;
      totalTodos += details.todo_remaining;

      if (details.todo_by_function) {
        for (const [key, value] of Object.entries(details.todo_by_function)) {
          aggregateTodoByFunction[key] += value;
        }
      }

      if (details.todo_by_function_multi) {
        for (const [key, value] of Object.entries(details.todo_by_function_multi)) {
          aggregateTodoByFunctionMulti[key] += value;
        }
      }
    }
  }

  // Print overall TODO breakdown
  if (totalTodos > 0) {
    const conversionRate = totalCalcs > 0 ? Math.round((totalMdxConverted / totalCalcs) * 100) : 0;

    console.log("\n--- Overall Metrics Conversion Summary ---");
    console.log(`  Total Calculated Metrics: ${totalCalcs}`);
    console.log(`  MDX Converted: ${totalMdxConverted}`);
    console.log(`  TODO Remaining: ${totalTodos}`);
    console.log(`  Overall Conversion Rate: ${conversionRate}%`);

    console.log(`\n  Overall TODO Breakdown by Primary Function:`);
    console.log(`    X-Agg (SUMX, AVERAGEX, etc.): ${aggregateTodoByFunction["x-agg"]} (${Math.round((aggregateTodoByFunction["x-agg"] / totalTodos) * 100)}%)`);
    console.log(`    Filter (FILTER, ISFILTERED, etc.): ${aggregateTodoByFunction.filter} (${Math.round((aggregateTodoByFunction.filter / totalTodos) * 100)}%)`);
    console.log(`    Time Intelligence: ${aggregateTodoByFunction.time} (${Math.round((aggregateTodoByFunction.time / totalTodos) * 100)}%)`);
    console.log(`    Selection (SELECTEDVALUE, etc.): ${aggregateTodoByFunction.selected} (${Math.round((aggregateTodoByFunction.selected / totalTodos) * 100)}%)`);
    console.log(`    Relationship (RELATED, VALUES, etc.): ${aggregateTodoByFunction.relationship} (${Math.round((aggregateTodoByFunction.relationship / totalTodos) * 100)}%)`);
    console.log(`    CALCULATE/CALCULATETABLE: ${aggregateTodoByFunction.calculate} (${Math.round((aggregateTodoByFunction.calculate / totalTodos) * 100)}%)`);
    console.log(`    Other: ${aggregateTodoByFunction.other} (${Math.round((aggregateTodoByFunction.other / totalTodos) * 100)}%)`);

    console.log(`\n  Overall TODO Breakdown by All Functions (multi-category, totals > 100%):`);
    console.log(`    X-Agg (SUMX, AVERAGEX, etc.): ${aggregateTodoByFunctionMulti["x-agg"]} (${Math.round((aggregateTodoByFunctionMulti["x-agg"] / totalTodos) * 100)}%)`);
    console.log(`    Filter (FILTER, ISFILTERED, etc.): ${aggregateTodoByFunctionMulti.filter} (${Math.round((aggregateTodoByFunctionMulti.filter / totalTodos) * 100)}%)`);
    console.log(`    Time Intelligence: ${aggregateTodoByFunctionMulti.time} (${Math.round((aggregateTodoByFunctionMulti.time / totalTodos) * 100)}%)`);
    console.log(`    Selection (SELECTEDVALUE, etc.): ${aggregateTodoByFunctionMulti.selected} (${Math.round((aggregateTodoByFunctionMulti.selected / totalTodos) * 100)}%)`);
    console.log(`    Relationship (RELATED, VALUES, etc.): ${aggregateTodoByFunctionMulti.relationship} (${Math.round((aggregateTodoByFunctionMulti.relationship / totalTodos) * 100)}%)`);
    console.log(`    CALCULATE/CALCULATETABLE: ${aggregateTodoByFunctionMulti.calculate} (${Math.round((aggregateTodoByFunctionMulti.calculate / totalTodos) * 100)}%)`);
    console.log(`    Other: ${aggregateTodoByFunctionMulti.other} (${Math.round((aggregateTodoByFunctionMulti.other / totalTodos) * 100)}%)`);
  }

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

      // Print category breakdown if available
      if (details.by_category) {
        const cat = details.by_category;
        console.log(`  Conversion Categories:`);
        console.log(`    Direct Conversion: ${cat.direct_conversion}`);
        console.log(`    Template Conversion: ${cat.template_conversion}`);
        console.log(`    VAR Inlined: ${cat.var_inlined}`);
        console.log(`    AI Conversion: ${cat.ai_conversion}`);
        console.log(`    Unconvertible: ${cat.unconvertible}`);
      }

      // Print TODO function breakdown if available
      if (details.todo_by_function && details.todo_remaining > 0) {
        const funcs = details.todo_by_function;
        const todoTotal = details.todo_remaining;

        console.log(`  TODO Breakdown by Primary Function (single category per calc):`);
        console.log(`    X-Agg (SUMX, AVERAGEX, etc.): ${funcs["x-agg"]} (${Math.round((funcs["x-agg"] / todoTotal) * 100)}%)`);
        console.log(`    Filter (FILTER, ISFILTERED, etc.): ${funcs.filter} (${Math.round((funcs.filter / todoTotal) * 100)}%)`);
        console.log(`    Time Intelligence: ${funcs.time} (${Math.round((funcs.time / todoTotal) * 100)}%)`);
        console.log(`    Selection (SELECTEDVALUE, etc.): ${funcs.selected} (${Math.round((funcs.selected / todoTotal) * 100)}%)`);
        console.log(`    Relationship (RELATED, VALUES, etc.): ${funcs.relationship} (${Math.round((funcs.relationship / todoTotal) * 100)}%)`);
        console.log(`    CALCULATE/CALCULATETABLE: ${funcs.calculate} (${Math.round((funcs.calculate / todoTotal) * 100)}%)`);
        console.log(`    Other: ${funcs.other} (${Math.round((funcs.other / todoTotal) * 100)}%)`);
      }

      // Print multi-category TODO breakdown if available
      if (details.todo_by_function_multi && details.todo_remaining > 0) {
        const funcs = details.todo_by_function_multi;
        const todoTotal = details.todo_remaining;

        console.log(`  TODO Breakdown by All Functions (multi-category, totals > 100%):`);
        console.log(`    X-Agg (SUMX, AVERAGEX, etc.): ${funcs["x-agg"]} (${Math.round((funcs["x-agg"] / todoTotal) * 100)}%)`);
        console.log(`    Filter (FILTER, ISFILTERED, etc.): ${funcs.filter} (${Math.round((funcs.filter / todoTotal) * 100)}%)`);
        console.log(`    Time Intelligence: ${funcs.time} (${Math.round((funcs.time / todoTotal) * 100)}%)`);
        console.log(`    Selection (SELECTEDVALUE, etc.): ${funcs.selected} (${Math.round((funcs.selected / todoTotal) * 100)}%)`);
        console.log(`    Relationship (RELATED, VALUES, etc.): ${funcs.relationship} (${Math.round((funcs.relationship / todoTotal) * 100)}%)`);
        console.log(`    CALCULATE/CALCULATETABLE: ${funcs.calculate} (${Math.round((funcs.calculate / todoTotal) * 100)}%)`);
        console.log(`    Other: ${funcs.other} (${Math.round((funcs.other / todoTotal) * 100)}%)`);
      }
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
