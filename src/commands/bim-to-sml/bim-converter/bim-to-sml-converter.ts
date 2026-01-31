import { SMLCatalog, SMLModel, SMLObjectType } from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { BimRoot, BimTable } from "../bim-models/bim-model";
import { Constants } from "../bim-models/constants";
import { orderProperties } from "../bim-models/order-properties";
import {
  AttributeMaps,
  MetricProps,
  TableLists,
} from "../bim-models/types-and-interfaces";
import { ConnectionConverter } from "./connection-converter";
import { checkForTimeDim } from "./converter-utils";
import { DatasetConverter } from "./dataset-converter";
import { DimensionConverter } from "./dimension-converter";
import { MeasureConverter } from "./measure-converter";
import { MeasureDependencyTracker } from "./measure-dependency-tracker";
import { PerspectiveConverter } from "./perspective-converter";
import { RelationshipConverter } from "./relationship-converter";
import { TableConverter } from "./table-converter";
import {
  expressionAsString,
  expressionAsOneLineLowerCaseString,
  firstChars,
  makeUniqueName,
  incrementNumberMap,
  mapToOneLiner,
} from "./tools";

export class BimToYamlConverter {
  constructor(readonly logger: Logger) {}

  async convert(
    bim: BimRoot,
    asConnection: string,
    llmName?: string,
  ): Promise<SmlConverterResult> {
    const repoSettings: SMLCatalog = {
      object_type: SMLObjectType.Catalog,
      unique_name: makeUniqueName(bim.name),
      version: 1.0,
      label: bim.name,
      aggressive_agg_promotion: false,
      build_speculative_aggs: false,
    };

    const oneModel: SMLModel = {
      object_type: SMLObjectType.Model,
      label: bim.name,
      unique_name: makeUniqueName(`model.${bim.name}`),
      relationships: [],
      dimensions: [], // references
      metrics: [], // references
      partitions: [],
      perspectives: [], // references
    };

    const result: SmlConverterResult = {
      connections: [],
      datasets: [],
      dimensions: [],
      measures: [],
      measuresCalculated: [],
      models: [oneModel],
      catalog: repoSettings,
      rowSecurity: [],
      compositeModels: [],
    };

    const model = result.models[0];

    const attrMaps: AttributeMaps = {
      // This map contains 2 different mappings
      //   <friendly obj name lower case> -> [<type>, [table]]
      //   <old/qualified name lower case> -> [<new friendly name>]
      attrNameMap: new Map<string, string[]>(),
      metricLookup: new Map<string, MetricProps>(),
      metricLabels: new Map<string, number>(),
    };

    const tableLists: TableLists = {
      measTables: new Set<string>(),
      unusedTables: new Set<string>(),
      leftTables: new Set<string>(),
      rightTables: new Set<string>(),
      factTables: new Array<BimTable>(),
      dimTables: new Array<BimTable>(),
      degenDims: new Set<string>(),
      calcGroupTables: new Set<string>(),
    };

    const tableConverter = new TableConverter(this.logger);
    // Identify and exclude calculation group tables first
    tableConverter.collectCalculationGroupTables(bim, tableLists);
    tableConverter.listUnusedBimTables(bim, tableLists, this.logger);

    // Classify tables as fact vs dimension BEFORE DAX conversion
    // so metrics are only created on fact tables
    tableConverter.populateTableLists(bim, tableLists);

    const measureConverter = new MeasureConverter(this.logger, llmName);
    measureConverter.setTableLists(tableLists);

    // Initialize dependency tracker and build dependency graph
    const dependencyTracker = new MeasureDependencyTracker(this.logger);
    dependencyTracker.buildFromBim(bim);

    // First pass: mark direct calc group measures in the tracker
    for (const table of bim.model?.tables || []) {
      for (const measure of table.measures || []) {
        const expr = expressionAsString(measure.expression);
        const reason = measureConverter.detectCalculationGroupUsage(expr);
        if (reason) {
          dependencyTracker.markAsCalcGroupDependent(measure.name, reason);
        }
      }
    }

    // Pass tracker to MeasureConverter
    measureConverter.setDependencyTracker(dependencyTracker);

    measureConverter.measuresFromSimpleMeasures(
      bim,
      result,
      attrMaps,
      tableLists.unusedTables,
    );

    const datasetConverter = new DatasetConverter(
      this.logger,
      measureConverter,
    );
    await datasetConverter.createDatasetsAndMetrics(
      bim,
      result,
      tableLists,
      attrMaps,
    );

    const dimensionConverter = new DimensionConverter(this.logger);
    dimensionConverter.createDimensions(tableLists, bim, attrMaps, result);

    const relationshipConverter = new RelationshipConverter(this.logger);
    relationshipConverter.createRelationships(
      bim,
      tableLists,
      model,
      attrMaps.attrNameMap,
      result,
    );

    measureConverter.measuresFromColumns(
      bim,
      result,
      model,
      attrMaps,
      tableLists.unusedTables,
      tableLists,
    );

    // Re-resolve measure references now that base metrics are created
    // This handles cases where column names have encoded unique_names (e.g., w/o → w_o)
    measureConverter.resolveUnresolvedReferences(result, attrMaps);

    relationshipConverter.addMissingRelationships(result, model);

    measureConverter.addUsedColumnsToDimension(bim, result, attrMaps);

    // For standalone fact scenario, populate degenerate dimensions from non-aggregatable columns
    tableConverter.populateDegenDimsForStandaloneFacts(bim, tableLists);

    dimensionConverter.createDegenDimensions(tableLists, bim, attrMaps, result);

    const perspectiveConverter = new PerspectiveConverter(this.logger);
    perspectiveConverter.createPerspectives(bim, result, attrMaps, tableLists);

    const connectionConverter = new ConnectionConverter(this.logger);
    connectionConverter.createConnections(
      asConnection || Constants.CONN_ID,
      bim,
      result,
    );

    // Order properties in the SML result
    orderProperties(result);

    checkForTimeDim(result, this.logger);

    let summary = myParseBIM(bim);
    summary += parseSML(result);
    console.log("FFFILE: " + summary);

    return result;
  }
}
// File: src/commands/bim-to-sml/bim-converter/parse-sml.ts

function asString(value: any): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function findExprFromCandidate(obj: any): string {
  if (!obj) return "";
  const candidates = [
    "expression",
    "expression_text",
    "mdx",
    "MDX",
    "formula",
    "definition",
    "calc",
  ];
  for (const k of candidates) {
    if (k in obj && typeof obj[k] === "string") return obj[k];
  }
  // fallback: try top-level string fields
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 0 && /[\s\w\W]{1,}/.test(v)) {
      // Heuristic: strings that contain keywords that look like expressions
      if (/\b(selector|SELECT|MDX|\/\*|TODO|\[|\]|SUM|COUNT)\b/i.test(v))
        return v;
    }
  }
  return "";
}

export function parseBIM(bim: BimRoot): void {
  if (!bim) {
    console.log("No BIM content to parse.");
    return;
  }

  type Candidate = {
    name: string;
    expr: string;
    path: string;
    kind: "table" | "partition" | "column";
  };

  const candidates: Candidate[] = [];

  function pushCandidate(
    node: any,
    path: string,
    kind: Candidate["kind"],
    explicitName?: string,
  ) {
    const expr = findExprFromCandidate(node).trim();
    const name =
      explicitName ||
      node?.name ||
      node?.unique_name ||
      node?.displayName ||
      node?.caption ||
      node?.label ||
      node?.column ||
      node?.column_name ||
      path.split("/").pop() ||
      "<unknown>";
    candidates.push({ name: String(name), expr, path, kind });
  }

  // Helper to get plural/single variations (kept for table internals)
  function getArray(node: any, ...keys: string[]) {
    for (const k of keys) {
      if (Array.isArray(node?.[k])) return node[k];
    }
    return [];
  }

  // Try to find the tables array robustly by recursively walking the BIM object.
  function findTables(root: any): any[] {
    const matches: { arr: any[]; path: string }[] = [];

    function looksLikeTableArray(arr: any[]): boolean {
      if (!Array.isArray(arr) || arr.length === 0) return false;
      // check first few elements for table-like shape
      const checkCount = Math.min(arr.length, 5);
      let score = 0;
      for (let i = 0; i < checkCount; i++) {
        const el = arr[i];
        if (el && typeof el === "object") {
          if (Array.isArray(el.columns) || Array.isArray(el.Columns)) score++;
          if (Array.isArray(el.partitions) || Array.isArray(el.Partitions))
            score++;
          if (typeof el.name === "string" || typeof el.label === "string")
            score++;
        }
      }
      // treat as table array if it has at least one of the table-like markers
      return score > 0;
    }

    function walk(node: any, path: string) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        if (looksLikeTableArray(node)) matches.push({ arr: node, path });
        // recurse elements to find nested arrays
        for (let i = 0; i < node.length; i++) {
          walk(node[i], `${path}[${i}]`);
        }
        return;
      }
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (Array.isArray(v)) {
          if (looksLikeTableArray(v))
            matches.push({ arr: v, path: `${path}/${k}` });
        }
        walk(v, `${path}/${k}`);
      }
    }

    walk(root, "bim");
    if (matches.length) {
      // prefer arrays explicitly named "tables" or "Tables" if present
      for (const m of matches) {
        if (m.path.toLowerCase().includes("/tables")) return m.arr;
      }
      // otherwise return the first match
      return matches[0].arr;
    }
    return [];
  }

  // Only traverse tables, partitions within tables, and columns
  let tables = getArray(bim, "tables", "Tables");
  if (!tables || tables.length === 0) {
    tables = findTables(bim);
  }

  for (let ti = 0; ti < tables.length; ti++) {
    const t = tables[ti];
    const tPath = `bim/tables[${ti}]`;
    // collect table-level expressions
    pushCandidate(t, tPath, "table");

    // partitions inside table
    const parts = getArray(t, "partitions", "Partitions", "Partition");
    for (let pi = 0; pi < parts.length; pi++) {
      const p = parts[pi];
      const pPath = `${tPath}/partitions[${pi}]`;
      pushCandidate(p, pPath, "partition");
    }

    // columns inside table
    const cols = getArray(t, "columns", "Columns", "ColumnsCollection");
    for (let ci = 0; ci < cols.length; ci++) {
      const c = cols[ci];
      const cPath = `${tPath}/columns[${ci}]`;
      pushCandidate(c, cPath, "column");
    }
  }

  // Analysis helpers
  function analyze(kind: Candidate["kind"], title: string) {
    const list = candidates.filter((c) => c.kind === kind);
    const total = list.length;
    let missing = 0;
    let todoCount = 0;
    let selectorCount = 0;
    let varStartCount = 0;
    const samplesMissing: string[] = [];
    const samplesTodo: string[] = [];
    const samplesSelector: string[] = [];
    const samplesVarStart: string[] = [];

    const selectorOrVarRegex = /selector|selectedvalue/i;
    const todoRegex = /\/\*.*todo.*\*\//i;
    const todoWordRegex = /\bTODO\b/i;
    const startsWithVar = /^\s*var\s+/i;

    for (const item of list) {
      const expr = (item.expr || "").trim();
      if (!expr) {
        missing++;
        if (samplesMissing.length < 10) samplesMissing.push(item.name);
        continue;
      }

      const hasTodo = todoRegex.test(expr) || todoWordRegex.test(expr);
      if (hasTodo) {
        todoCount++;
        if (samplesTodo.length < 10)
          samplesTodo.push(`${item.name} -> ${expr.slice(0, 120)}`);
      }

      const hasSelector = selectorOrVarRegex.test(expr);
      if (hasSelector) {
        selectorCount++;
        if (samplesSelector.length < 10)
          samplesSelector.push(`${item.name} -> ${expr.slice(0, 120)}`);
      }

      const hasVarStart = startsWithVar.test(expr);
      if (hasVarStart) {
        varStartCount++;
        if (samplesVarStart.length < 10)
          samplesVarStart.push(`${item.name} -> ${expr.slice(0, 120)}`);
      }
    }

    console.log(`\n${title}:`);
    console.log(`  total scanned: ${total}`);
    console.log(`  missing / empty expressions: ${missing}`);
    console.log(
      `  expressions containing "selector" / "selectedvalue": ${selectorCount}`,
    );
    console.log(`  expressions starting with "var ": ${varStartCount}`);

    if (samplesTodo.length) {
      console.log(`  Examples with TODO (up to 10):`);
      samplesTodo.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
    }
    if (samplesSelector.length) {
      console.log(`  Examples with selector/selectedvalue (up to 10):`);
      samplesSelector.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
    }
    if (samplesVarStart.length) {
      console.log(`  Examples starting with "var " (up to 10):`);
      samplesVarStart.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
    }
    if (samplesMissing.length) {
      console.log(`  Examples missing expressions (up to 10):`);
      samplesMissing.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
    }
  }

  analyze("table", "BIM table-level expressions summary");
  analyze("partition", "BIM partition-level expressions summary");
  analyze("column", "BIM column-level expressions summary");

  // BIM structure quick summary
  const tablesCount = Array.isArray(tables) ? tables.length : 0;
  let totalColumns = 0;
  for (const t of tables) {
    const cols = getArray(t, "columns", "Columns", "ColumnsCollection");
    totalColumns += Array.isArray(cols) ? cols.length : 0;
  }

  console.log("\nBIM structure summary (best-effort):");
  console.log(`  tables: ${tablesCount}`);
  console.log(`  columns (sum of all tables): ${totalColumns}`);
  console.log("");
}

export function parseSML(result: SmlConverterResult): string {
  const measuresList = ([] as any[]).concat(
    result.measures || [],
    result.measuresCalculated || [],
  );

  let totalCalc = measuresList.length;
  let converted = 0;
  let notConverted = 0; // e.g. "0 /*...TODO...*/"
  let containsSelector = 0;
  let missingExpression = 0;
  let todoCount = 0;
  const samplesNotConverted: string[] = [];
  const samplesSelector: string[] = [];
  const samplesMissing: string[] = [];
  let summary = "";

  for (const m of measuresList) {
    const name =
      (m && (m.unique_name || m.uniqueName || m.name || m.label)) ||
      (typeof m === "string" ? m : "<unknown>");
    const expr = findExprFromCandidate(m).trim();

    if (!expr) {
      missingExpression++;
      samplesMissing.push(String(name));
      continue;
    }

    const lower = expr.toLowerCase();

    const looksLikeTodoZero =
      /^0\s*\/\*.*todo.*\*\/\s*$/i.test(expr) ||
      /0\s*\/\*\s*\.\.\.\s*TODO/i.test(expr) ||
      (/\/\*.*todo.*\*\//i.test(expr) && /\b0\b/.test(expr));
    const hasTodo = /\/\*.*todo.*\*\//i.test(expr) || /\bTODO\b/i.test(expr);
    const hasSelector = /selector|selectedvalue/i.test(expr);

    if (looksLikeTodoZero) {
      notConverted++;
      todoCount++;
      samplesNotConverted.push(String(name) + " -> " + expr.slice(0, 120));
    } else if (hasTodo) {
      // treat TODO-marked expressions as not fully converted
      notConverted++;
      todoCount++;
      samplesNotConverted.push(String(name) + " -> " + expr.slice(0, 120));
    } else {
      converted++;
    }

    if (hasSelector) {
      containsSelector++;
      if (samplesSelector.length < 10)
        samplesSelector.push(String(name) + " -> " + expr.slice(0, 120));
    }
  }

  console.log("");
  console.log("SML Calculations summary:");
  console.log(`  total calculations scanned: ${totalCalc}`);
  summary += `\t${totalCalc}`;
  console.log(`  converted (non-TODO looking): ${converted}`);
  summary += `\t${converted}`;
  console.log(`  not-converted / TODO-like: ${notConverted}`);
  summary += `\t${notConverted}`;
  if (todoCount) console.log(`    (TODO markers found: ${todoCount})`);
  console.log(`  missing / empty expressions: ${missingExpression}`);
  summary += `\t${missingExpression}`;
  console.log(
    `  expressions containing "selector or selectedvalue" (case-insensitive): ${containsSelector}`,
  );
  summary += `\t${containsSelector}`;

  if (samplesNotConverted.length) {
    console.log("  Examples of not-converted / TODO expressions (up to 10):");
    samplesNotConverted
      .slice(0, 10)
      .forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
  }
  if (samplesSelector.length) {
    console.log(
      "  Examples containing 'selector or selectedvalue' (up to 10):",
    );
    samplesSelector.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
  }
  if (samplesMissing.length) {
    console.log("  Examples missing expressions (up to 10):");
    samplesMissing
      .slice(0, 10)
      .forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
  }

  // Datasets analysis
  const datasets = result.datasets || [];
  let dsTotal = datasets.length;
  let dsWithExpressions = 0;
  let dsWithTodo = 0;
  let dsWithSelector = 0;
  const dsSamplesWithExpr: string[] = [];
  const dsSamplesTodo: string[] = [];

  for (const d of datasets) {
    const dsName = (d && (d.unique_name || d.label)) || "<dataset>";
    const dsStr = asString(d);
    const hasExpr =
      /"expression"\s*:|"mdx"\s*:|"formula"\s*:|\/\*.*todo.*\*\//i.test(
        dsStr,
      ) || /\bMDX\b|\bselector|selectedvalue\b/i.test(dsStr);
    if (hasExpr) {
      dsWithExpressions++;
      if (dsSamplesWithExpr.length < 10) dsSamplesWithExpr.push(String(dsName));
    }
    if (/\/\*.*todo.*\*\//i.test(dsStr) || /\bTODO\b/i.test(dsStr)) {
      dsWithTodo++;
      if (dsSamplesTodo.length < 10) dsSamplesTodo.push(String(dsName));
    }
    if (/selector|selectedvalue/i.test(dsStr)) {
      dsWithSelector++;
    }
  }

  console.log("\nDatasets summary:");
  console.log(`  total datasets scanned: ${dsTotal}`);
  summary += `\t${dsTotal}`;
  console.log(`  datasets with expression-like content: ${dsWithExpressions}`);
  summary += `\t${dsWithExpressions}`;
  console.log(`  datasets with TODO markers: ${dsWithTodo}`);
  summary += `\t${dsWithTodo}`;
  console.log(`  datasets with "selector" occurrences: ${dsWithSelector}`);
  summary += `\t${dsWithSelector}`;
  // if (dsSamplesWithExpr.length) {
  //   console.log("  Example datasets with expressions (up to 10):");
  //   dsSamplesWithExpr.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
  // }
  // if (dsSamplesTodo.length) {
  //   console.log("  Example datasets with TODO markers (up to 10):");
  //   dsSamplesTodo.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
  // }
  console.log("");
  return summary;
}

export function myParseBIM(bim: BimRoot): string {
  if (!bim) {
    console.log("No BIM content to parse.");
    return "";
  }
  const sampleSize = 5;
  const exprLen = 120;
  let totalTables = 0;
  let tablesWithExpr = 0;
  let tablesVarStart = 0;
  let tablesWithSelector = 0;
  let totalPartitions = 0;
  const partitionTypes = new Map<string, number>();
  const partitionModes = new Map<string, number>();
  const samplesTableExpr: string[] = [];
  let totalColumns = 0;
  let columnsWithExpr = 0;
  let columnsVarStart = 0;
  let columnsWithSelector = 0;
  const samplesColVarExpr: string[] = [];
  const samplesColSelectorExpr: string[] = [];
  let totalMeasures = 0;
  let measuresWithExpr = 0;
  let measuresVarStart = 0;
  let measuresWithSelector = 0;
  let summary = bim.name;
  let totalCalculate = 0;
  let totalFilter = 0;
  let totalCalcAndFilter = 0;

  bim.model.tables.forEach((table) => {
    totalTables++;
    if (table.partitions) {
      const expr = expressionAsString(table.partitions[0]?.source?.expression)
        ?.trim()
        .toLowerCase();
      if (expr) {
        tablesWithExpr++;
        if (startsWithVar(expr)) tablesVarStart++;
        if (hasSelector(expr)) tablesWithSelector++;
        if (samplesTableExpr.length < sampleSize)
          samplesTableExpr.push(firstChars(expr, exprLen));
      }
      table.partitions?.forEach((p) => {
        totalPartitions++;
        incrementNumberMap(partitionTypes, p.source.type);
        incrementNumberMap(partitionModes, p.mode);
      });
    }

    table.columns?.forEach((column) => {
      const expr = expressionAsOneLineLowerCaseString(column.expression)
        ?.trim()
        .toLowerCase();
      totalColumns++;
      if (expr) {
        columnsWithExpr++;
        if (startsWithVar(expr)) {
          columnsVarStart++;
          if (samplesColVarExpr.length < sampleSize)
            samplesColVarExpr.push(firstChars(expr, exprLen));
        }
        if (hasSelector(expr)) {
          columnsWithSelector++;
          if (samplesColSelectorExpr.length < sampleSize)
            samplesColSelectorExpr.push(firstChars(expr, exprLen));
        }
      }
    });

    table.measures?.forEach((measure) => {
      const expr = expressionAsOneLineLowerCaseString(measure.expression)
        ?.trim()
        .toLowerCase();
      totalMeasures++;
      if (expr) {
        measuresWithExpr++;
        if (startsWithVar(expr)) {
          measuresVarStart++;
          // if (samplesColVarExpr.length < sampleSize)
          //   samplesColVarExpr.push(firstChars(expr, exprLen));
        }
        if (hasSelector(expr)) {
          measuresWithSelector++;
          // if (samplesColSelectorExpr.length < sampleSize)
          //   samplesColSelectorExpr.push(firstChars(expr, exprLen));
        }
        if (expr.toLowerCase().includes("calculate")) {
          totalCalculate++;
        }
        if (expr.toLowerCase().includes("filter")) {
          totalFilter++;
        }
        if (
          expr.toLowerCase().includes("calculate") &&
          expr.toLowerCase().includes("filter")
        ) {
          totalCalcAndFilter++;
        }
      }
    });
  });

  console.log("\nBIM tables summary:");
  console.log(`  Total tables: ${totalTables}`);
  summary += `\t${totalTables}`;
  console.log(`  Tables with expressions: ${tablesWithExpr}`);
  summary += `\t${tablesWithExpr}`;
  samplesTableExpr.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
  console.log(`  Tables starting with 'var ': ${tablesVarStart}`);
  summary += `\t${tablesVarStart}`;
  console.log(`  Tables using selectors: ${tablesWithSelector}`);
  summary += `\t${tablesWithSelector}`;

  console.log("\nBIM partitions summary:");
  console.log(`  Total partitions: ${totalPartitions}`);
  // summary += `\t${totalTables}`;
  console.log(`  Partitions types: ${mapToOneLiner(partitionTypes)}`);
  console.log(`  Partitions modes: ${mapToOneLiner(partitionModes)}`);

  console.log("\nBIM columns summary:");
  console.log(`  Total columns: ${totalColumns}`);
  summary += `\t${totalColumns}`;
  console.log(`  Columns with expressions: ${columnsWithExpr}`);
  summary += `\t${columnsWithExpr}`;
  console.log(`  Columns starting with 'var ': ${columnsVarStart}`);
  summary += `\t${columnsVarStart}`;
  samplesColVarExpr.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
  console.log(`  Columns using selectors: ${columnsWithSelector}`);
  summary += `\t${columnsWithSelector}`;
  samplesColSelectorExpr.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));

  console.log("\nBIM measures summary:");
  console.log(`  Total measures: ${totalMeasures}`);
  summary += `\t${totalMeasures}`;
  console.log(`  Measures with expressions: ${measuresWithExpr}`);
  summary += `\t${measuresWithExpr}`;
  console.log(`  Measures starting with 'var ': ${measuresVarStart}`);
  summary += `\t${measuresVarStart}`;
  samplesColVarExpr.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
  console.log(`  Measures using selectors: ${measuresWithSelector}`);
  summary += `\t${measuresWithSelector}`;
  console.log(`  Measures using CALCULATE: ${totalCalculate}`);
  summary += `\t${totalCalculate}`;
  console.log(`  Measures using FILTER: ${totalFilter}`);
  summary += `\t${totalFilter}`;
  console.log(
    `  Measures using both CALCULATE and FILTER: ${totalCalcAndFilter}`,
  );
  summary += `\t${totalCalcAndFilter}`;

  return summary;
}

function startsWithVar(expr: string): boolean {
  if (!expr) return false;
  if (expr.trim().startsWith("var ") || expr.trim().startsWith("var\n"))
    return true;
  return false;
}

function hasSelector(expr: string): boolean {
  if (!expr) return false;
  if (expr.includes("selector") || expr.includes("selectedvalue")) return true;
  return false;
}
