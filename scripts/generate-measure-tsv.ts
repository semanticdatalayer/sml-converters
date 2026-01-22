#!/usr/bin/env tsx
/**
 * Generate TSV of measure conversions with function category breakdown
 *
 * Usage:
 *   npx tsx scripts/generate-measure-tsv.ts <bim-file> [output.tsv]
 */

import fs from "fs/promises";
import path from "path";
import { BimFileParser } from "../src/commands/bim-to-sml/bim-file-parser";
import { BimToYamlConverter } from "../src/commands/bim-to-sml/bim-converter/bim-to-sml-converter";
import { SmlConverterResult } from "../src/shared/sml-convert-result";
import { Logger } from "../src/shared/logger";
import { BimMeasure } from "../src/commands/bim-to-sml/bim-models/bim-model";

class SilentLogger implements Logger {
  error(message: string) {}
  warn(message: string) {}
  info(message: string) {}
  http(message: string) {}
  verbose(message: string) {}
  debug(message: string) {}
  silly(message: string) {}
}

interface MeasureInfo {
  name: string;
  tableName: string;
  originalExpression: string;
  newExpression: string;
  converted: boolean;
  categories: {
    xAgg: boolean;
    filter: boolean;
    time: boolean;
    selected: boolean;
    relationship: boolean;
    calculate: boolean;
    calculationGroup: boolean;
    other: boolean;
  };
}

function categorizeExpression(expr: string): MeasureInfo["categories"] {
  const upperExpr = expr.toUpperCase();
  const categories = {
    xAgg: false,
    filter: false,
    time: false,
    selected: false,
    relationship: false,
    calculate: false,
    calculationGroup: false,
    other: false,
  };

  // calculationgroup
  if (expr.includes("TODO uses calculationgroup") || /SELECTEDMEASURE\b/.test(upperExpr)) {
    categories.calculationGroup = true;
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
    categories.xAgg = true;
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
    categories.filter = true;
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
    categories.time = true;
  }

  // selected: selection context functions
  if (
    /SELECTEDVALUE\b/.test(upperExpr) ||
    /HASONEVALUE\b/.test(upperExpr) ||
    /ALLSELECTED\b/.test(upperExpr) ||
    /ISINSCOPE\b/.test(upperExpr) ||
    /ISSELECTEDMEASURE\b/.test(upperExpr)
  ) {
    categories.selected = true;
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
    categories.relationship = true;
  }

  // calculate: CALCULATE/CALCULATETABLE
  if (/CALCULATE\b/.test(upperExpr) || /CALCULATETABLE\b/.test(upperExpr)) {
    categories.calculate = true;
  }

  // other: if no categories matched
  const hasAnyCategory = Object.values(categories).some((v) => v);
  if (!hasAnyCategory) {
    categories.other = true;
  }

  return categories;
}

function escapeForTsv(str: string, preserveNewlines: boolean = false): string {
  // Escape quotes by doubling them
  let escaped = str.replace(/"/g, '""');
  // Replace tabs with spaces
  escaped = escaped.replace(/\t/g, "    ");

  if (preserveNewlines) {
    // Keep newlines but wrap in quotes (TSV/CSV standard for multi-line)
    if (escaped.includes("\n") || escaped.includes("\r")) {
      return `"${escaped}"`;
    }
  } else {
    // Collapse newlines to spaces
    escaped = escaped.replace(/\r?\n/g, " ");
  }

  return escaped;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: npx tsx scripts/generate-measure-tsv.ts <bim-file> [output.tsv]");
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace(/\.(bim|json)$/i, "-measures.tsv");

  // Parse BIM file
  const logger = new SilentLogger();
  const parser = BimFileParser.create(logger);
  const bim = await parser.parseFile(inputFile);

  // Build map of original measures (name -> expression)
  const originalMeasures = new Map<string, { expr: string; table: string }>();
  for (const table of bim.model?.tables || []) {
    for (const measure of table.measures || []) {
      const expr = Array.isArray(measure.expression)
        ? measure.expression.join("\n")
        : measure.expression || "";
      originalMeasures.set(measure.name, { expr, table: table.name });
    }
  }

  // Convert BIM to SML
  const converter = new BimToYamlConverter(logger);
  const result = await converter.convert(bim, "Postgres");

  // Build map of converted measures (label -> expression)
  const convertedMeasures = new Map<string, string>();
  for (const calc of result.measuresCalculated) {
    if (calc.label) {
      convertedMeasures.set(calc.label, calc.expression || "");
    }
  }

  // Build output rows
  const rows: MeasureInfo[] = [];
  for (const [name, { expr, table }] of originalMeasures) {
    const newExpr = convertedMeasures.get(name) || "";
    const converted = newExpr.length > 0 && !newExpr.includes("TODO");

    // Categorize based on original expression
    const categories = categorizeExpression(expr);

    rows.push({
      name,
      tableName: table,
      originalExpression: expr,
      newExpression: newExpr,
      converted,
      categories,
    });
  }

  // Sort by table name, then measure name
  rows.sort((a, b) => {
    const tableCompare = a.tableName.localeCompare(b.tableName);
    if (tableCompare !== 0) return tableCompare;
    return a.name.localeCompare(b.name);
  });

  // Generate TSV
  const headers = [
    "Measure Name",
    "Table",
    "Original Expression",
    "New Expression",
    "Converted",
    "X-Agg",
    "Filter",
    "Time",
    "Selected",
    "Relationship",
    "Calculate",
    "CalcGroup",
    "Other",
  ];

  const tsvLines = [headers.join("\t")];

  for (const row of rows) {
    const line = [
      escapeForTsv(row.name),
      escapeForTsv(row.tableName),
      escapeForTsv(row.originalExpression, true),  // preserve newlines
      escapeForTsv(row.newExpression, true),       // preserve newlines
      row.converted ? "Y" : "N",
      row.categories.xAgg ? "Y" : "",
      row.categories.filter ? "Y" : "",
      row.categories.time ? "Y" : "",
      row.categories.selected ? "Y" : "",
      row.categories.relationship ? "Y" : "",
      row.categories.calculate ? "Y" : "",
      row.categories.calculationGroup ? "Y" : "",
      row.categories.other ? "Y" : "",
    ];
    tsvLines.push(line.join("\t"));
  }

  await fs.writeFile(outputFile, tsvLines.join("\n"), "utf-8");

  console.log(`Generated ${outputFile}`);
  console.log(`Total measures: ${rows.length}`);
  console.log(`Converted: ${rows.filter((r) => r.converted).length}`);
  console.log(`TODO: ${rows.filter((r) => !r.converted).length}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
