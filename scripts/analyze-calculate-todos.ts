#!/usr/bin/env tsx
/**
 * Analyze CALCULATE TODO Expressions
 *
 * Finds DAX measure expressions that:
 * 1. Are not converted (end up with TODO)
 * 2. Start with "CALCULATE" (case insensitive)
 * 3. Don't have any other unsupported functions
 *
 * Usage:
 *   tsx scripts/analyze-calculate-todos.ts --input /path/to/bim/files
 */

import fs from "fs/promises";
import path from "path";
import { BimFileParser } from "../src/commands/bim-to-sml/bim-file-parser";
import { BimToYamlConverter } from "../src/commands/bim-to-sml/bim-converter/bim-to-sml-converter";
import { Logger } from "../src/shared/logger";

class SilentLogger implements Logger {
  error(message: string) {}
  warn(message: string) {}
  info(message: string) {}
  http(message: string) {}
  verbose(message: string) {}
  debug(message: string) {}
  silly(message: string) {}
}

interface CalculateExpression {
  file: string;
  table: string;
  measure: string;
  dax: string;
  convertedExpression: string;
}

// All unsupported functions to check for (excluding CALCULATE itself)
const UNSUPPORTED_FUNCTIONS = [
  // X-Agg functions
  /SUMX\b/i,
  /AVERAGEX\b/i,
  /AVGX\b/i,
  /MINX\b/i,
  /MAXX\b/i,
  /COUNTX\b/i,
  /RANKX\b/i,
  /PRODUCTX\b/i,
  /CONCATENATEX\b/i,
  /COUNTAX\b/i,

  // Filter functions
  /\bFILTER\b/i,
  /HASONEFILTER\b/i,
  /ISFILTERED\b/i,
  /KEEPFILTERS\b/i,
  /REMOVEFILTERS\b/i,
  /CROSSFILTER\b/i,
  /ISCROSSFILTERED\b/i,
  /ALLEXCEPT\b/i,
  /USERELATIONSHIP\b/i,

  // Time intelligence
  /TOTALYTD\b/i,
  /TOTALQTD\b/i,
  /TOTALMTD\b/i,
  /SAMEPERIODLASTYEAR\b/i,
  /DATEADD\b/i,
  /DATESBETWEEN\b/i,
  /DATESINPERIOD\b/i,
  /DATESYTD\b/i,
  /DATESQTD\b/i,
  /DATESMTD\b/i,
  /PARALLELPERIOD\b/i,
  /NEXTDAY\b/i,
  /NEXTMONTH\b/i,
  /NEXTQUARTER\b/i,
  /NEXTYEAR\b/i,
  /PREVIOUSDAY\b/i,
  /PREVIOUSMONTH\b/i,
  /PREVIOUSQUARTER\b/i,
  /PREVIOUSYEAR\b/i,
  /STARTOFYEAR\b/i,
  /STARTOFQUARTER\b/i,
  /STARTOFMONTH\b/i,
  /ENDOFYEAR\b/i,
  /ENDOFQUARTER\b/i,
  /ENDOFMONTH\b/i,

  // Selection context
  /SELECTEDVALUE\b/i,
  /HASONEVALUE\b/i,
  /ALLSELECTED\b/i,
  /ISINSCOPE\b/i,
  /SELECTEDMEASURE\b/i,
  /ISSELECTEDMEASURE\b/i,

  // Relationship functions
  /\bRELATED\b/i,
  /RELATEDTABLE\b/i,
  /LOOKUPVALUE\b/i,
  /\bPATH\b/i,
  /PATHITEM\b/i,
  /PATHCONTAINS\b/i,
  /PATHLENGTH\b/i,
  /\bVALUES\b/i,
  /\bDISTINCT\b/i,
  /CROSSJOIN\b/i,
  /CURRENTGROUP\b/i,
  /GROUPBY\b/i,
  /NATURALINNERJOIN\b/i,
  /NATURALLEFTOUTERJOIN\b/i,
  /\bINTERSECT\b/i,
  /\bUNION\b/i,
  /\bEXCEPT\b/i,

  // CALCULATETABLE
  /CALCULATETABLE\b/i,
];

function hasUnsupportedFunctions(expr: string): boolean {
  for (const pattern of UNSUPPORTED_FUNCTIONS) {
    if (pattern.test(expr)) {
      return true;
    }
  }
  return false;
}

async function analyzeBimFile(
  filePath: string,
  logger: Logger
): Promise<CalculateExpression[]> {
  const results: CalculateExpression[] = [];
  const fileName = path.basename(filePath);

  try {
    // Parse BIM file
    const parser = BimFileParser.create(logger);
    const bim = await parser.parseFile(filePath);

    // Convert to SML
    const converter = new BimToYamlConverter(logger);
    const result = await converter.convert(bim, "Postgres");

    // Check each calculated metric
    for (const metric of result.measuresCalculated) {
      const expr = metric.expression || "";

      // Must have TODO (not converted)
      if (!expr.includes("TODO")) {
        continue;
      }

      // Extract original DAX from TODO comment
      const todoMatch = expr.match(/\/\*\s*TODO:\s*(.+?)\s*\*\//);
      if (!todoMatch) {
        continue;
      }

      const originalDax = todoMatch[1];

      // Must start with CALCULATE (case insensitive)
      if (!/^\s*CALCULATE\s*\(/i.test(originalDax)) {
        continue;
      }

      // Must NOT have any other unsupported functions
      if (hasUnsupportedFunctions(originalDax)) {
        continue;
      }

      // Find the original measure in BIM
      let tableName = "";
      let measureName = "";
      for (const table of bim.model?.tables || []) {
        const measure = table.measures?.find(m => {
          const calcKey = `calculation.${table.name}.${m.name}`.toLowerCase();
          return metric.unique_name?.toLowerCase().includes(m.name.toLowerCase());
        });
        if (measure) {
          tableName = table.name;
          measureName = measure.name;
          break;
        }
      }

      results.push({
        file: fileName,
        table: tableName,
        measure: measureName,
        dax: originalDax,
        convertedExpression: expr,
      });
    }
  } catch (error) {
    console.error(`Error processing ${fileName}: ${error}`);
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf("--input");

  if (inputIndex === -1 || !args[inputIndex + 1]) {
    console.error("Usage: tsx scripts/analyze-calculate-todos.ts --input /path/to/bim/files");
    process.exit(1);
  }

  const inputDir = args[inputIndex + 1];

  // Find all BIM files
  const files = await fs.readdir(inputDir);
  const bimFiles = files
    .filter(f => f.endsWith(".bim.json") || f.endsWith("_bim.json"))
    .map(f => path.join(inputDir, f));

  console.log(`Scanning ${bimFiles.length} BIM files for CALCULATE-only TODO expressions...\n`);

  const logger = new SilentLogger();
  const allResults: CalculateExpression[] = [];

  for (const filePath of bimFiles) {
    const results = await analyzeBimFile(filePath, logger);
    allResults.push(...results);
  }

  console.log(`\n=== CALCULATE-Only TODO Expressions ===`);
  console.log(`Found ${allResults.length} expressions\n`);

  if (allResults.length === 0) {
    console.log("No CALCULATE-only TODO expressions found.");
    return;
  }

  // Group by file
  const byFile = new Map<string, CalculateExpression[]>();
  for (const result of allResults) {
    if (!byFile.has(result.file)) {
      byFile.set(result.file, []);
    }
    byFile.get(result.file)!.push(result);
  }

  // Print results
  for (const [file, expressions] of byFile.entries()) {
    console.log(`\n${file} (${expressions.length} expressions):`);
    for (let i = 0; i < expressions.length; i++) {
      const expr = expressions[i];
      console.log(`\n  ${i + 1}. ${expr.measure} (${expr.table})`);
      console.log(`     DAX: ${expr.dax.substring(0, 200)}${expr.dax.length > 200 ? '...' : ''}`);
    }
  }

  // Summary statistics
  console.log(`\n\n=== Summary ===`);
  console.log(`Total files with CALCULATE-only TODOs: ${byFile.size}`);
  console.log(`Total CALCULATE-only TODO expressions: ${allResults.length}`);

  // Sample a few for detailed view
  console.log(`\n=== Sample Expressions (first 10) ===`);
  for (let i = 0; i < Math.min(10, allResults.length); i++) {
    const expr = allResults[i];
    console.log(`\n${i + 1}. ${expr.file} :: ${expr.measure}`);
    console.log(`   ${expr.dax}`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
