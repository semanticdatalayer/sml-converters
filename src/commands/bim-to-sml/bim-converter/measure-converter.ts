import {
  SMLCalculationMethod,
  SMLMetric,
  SMLMetricCalculated,
  SMLModel,
  SMLModelMetricsAndCalc,
  SMLObjectType,
  SMLUnrelatedDimensionsHandling,
} from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import {
  BimMeasure,
  BimRoot,
  BimTable,
  BimTableColumn,
} from "../bim-models/bim-model";
import { Constants } from "../bim-models/constants";
import { AttributeMaps, TableLists } from "../bim-models/types-and-interfaces";
import {
  convertDaxToMdxWithAi,
  getTableColumnFromDax,
  replaceUsedMeasures,
} from "./ai-dax-converter";
import {
  colsUsedByTbl,
  doCreateSummary,
  listRelationshipColumns,
  shortAggFn,
} from "./converter-utils";
import { DaxTokenizer, FunctionToken, getMeasureName } from "./dax-converter";
import { ConversionPipeline } from "./conversion-pipeline";
import { createConversionContext } from "./conversion-templates/conversion-context";
import { ConversionCategory } from "./conversion-result";
import { DimensionConverter } from "./dimension-converter";
import {
  aggFunctionAtStart,
  initialMetric,
  isSimpleCountRowsFunction,
  isSimpleFunctionWithCol,
} from "./expression-parser";
import {
  createUniqueAttrName,
  descriptionAsString,
  errorUtil,
  escapeForComment,
  expressionAsString,
  firstChars,
  incrementNumberMap,
  isHidden,
  lookupAttrUniqueName,
  lowerNoSpace,
  makeUniqueName,
  removeComments,
} from "./tools";
import { MeasureDependencyTracker } from "./measure-dependency-tracker";
// import { Tools } from "../../../shared/tools";

export class MeasureConverter {
  private logger: Logger;
  private llmName?: string;
  private usedColumnsInDax: Set<string> = new Set();
  private tableLists?: TableLists;
  private dependencyTracker?: MeasureDependencyTracker;

  constructor(logger: Logger, llmName?: string) {
    this.logger = logger;
    this.llmName = llmName;
  }

  setTableLists(tableLists: TableLists) {
    this.tableLists = tableLists;
  }

  setDependencyTracker(tracker: MeasureDependencyTracker) {
    this.dependencyTracker = tracker;
  }

  // Map of measure label (original name) -> table name
  // Used for lookup when measures reference each other
  private measureTableMap: Map<string, string> = new Map();

  /**
   * Build a lookup of measure names to their tables.
   * This is used for reference resolution when measures reference other measures
   * that haven't been converted yet.
   */
  buildMeasureTableMap(bim: BimRoot): void {
    this.measureTableMap.clear();
    for (const table of bim.model?.tables || []) {
      for (const measure of table.measures || []) {
        // Store mapping: measureName -> tableName
        this.measureTableMap.set(measure.name, table.name);
      }
    }
    this.logger.debug?.(`Built measure lookup with ${this.measureTableMap.size} measures`);
  }

  /**
   * Get the table name for a measure by its label/name.
   * Used for resolving cross-measure references.
   */
  getMeasureTable(measureName: string): string | undefined {
    return this.measureTableMap.get(measureName);
  }

  /**
   * Post-process all calculated metrics to resolve __UNRESOLVED__ markers.
   * Called after all measures have been converted.
   */
  resolveUnresolvedReferences(
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
  ): void {
    const unresolvedPattern = /\[Measures\]\.\[__UNRESOLVED__(.+?)__\]/g;
    let resolvedCount = 0;
    let unresolvedCount = 0;

    for (const calc of result.measuresCalculated) {
      if (!calc.expression) continue;

      const newExpression = calc.expression.replace(unresolvedPattern, (match, measureName) => {
        // Find the table for this measure
        const tableName = this.measureTableMap.get(measureName);
        if (!tableName) {
          unresolvedCount++;
          this.logger.warn(`Could not resolve reference to measure '${measureName}' in calc '${calc.unique_name}'`);
          return `[Measures].[${measureName}]`; // Use original name as fallback
        }

        // Look up the unique_name in attrNameMap
        const calcKey = (makeUniqueName(`calculation.${tableName}.`) + measureName).toLowerCase();
        const lookupResult = attrMaps.attrNameMap.get(calcKey);
        if (lookupResult && lookupResult.length > 0) {
          resolvedCount++;
          return `[Measures].[${lookupResult[0]}]`;
        }

        unresolvedCount++;
        this.logger.warn(`Could not find unique_name for measure '${measureName}' in calc '${calc.unique_name}'`);
        return `[Measures].[${measureName}]`; // Use original name as fallback
      });

      calc.expression = newExpression;
    }

    if (resolvedCount > 0 || unresolvedCount > 0) {
      this.logger.info(`Resolved ${resolvedCount} measure references, ${unresolvedCount} could not be resolved`);
    }
  }

  /**
   * Check if a DAX expression uses calculation groups.
   * Returns a reason string if calc group usage detected, undefined otherwise.
   */
  detectCalculationGroupUsage(daxExpression: string): string | undefined {
    const exprLower = daxExpression.toLowerCase();

    // Check for SELECTEDMEASURE() function - always indicates calc group usage
    if (exprLower.includes("selectedmeasure(") || exprLower.includes("selectedmeasure (")) {
      return "uses SELECTEDMEASURE()";
    }

    // Check for references to calculation group tables
    if (this.tableLists?.calcGroupTables) {
      for (const cgTable of this.tableLists.calcGroupTables) {
        // Check for table[column] pattern: 'TableName'[col] or TableName[col]
        const patterns = [
          `'${cgTable}'[`,      // 'CG - Time Intelligence'[
          `${cgTable}[`,        // TableName[ (without quotes)
          `'${cgTable.toLowerCase()}'[`,
          `${cgTable.toLowerCase()}[`,
        ];
        for (const pattern of patterns) {
          if (exprLower.includes(pattern.toLowerCase())) {
            return `references '${cgTable}'`;
          }
        }
      }
    }

    return undefined;
  }

  private isDimensionTable(tableName: string): boolean {
    return this.isDimensionOnlyTable(tableName);
  }

  /**
   * Check if a table is dimension-only (in dimTables but not in factTables).
   * Public method for use by dax-converter.
   */
  isDimensionOnlyTable(tableName: string): boolean {
    if (!this.tableLists) return false;
    const isDim = this.tableLists.dimTables.some((t) => t.name === tableName);
    const isFact = this.tableLists.factTables.some((t) => t.name === tableName);
    // A table is dimension-only if it's in dimTables but NOT in factTables
    return isDim && !isFact;
  }

  // If a calc uses an agg function and that's the only thing in the expression,
  // confirms the table/column exist then creates as a measure in SML rather than a calculation.
  // Create these first so they can be referenced later in other calcs
  measuresFromSimpleMeasures(
    bim: BimRoot,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
    unusedTables: Set<string>,
  ) {
    if (bim.model?.tables)
      bim.model.tables.forEach((bimMeasTable) => {
        bimMeasTable.measures?.forEach((meas) => {
          if (meas.expression) {
            const exprLowerNoSpace = lowerNoSpace(
              removeComments(expressionAsString(meas.expression)),
            );
            const aggFn = aggFunctionAtStart(exprLowerNoSpace);

            // DISABLED: Old code that bypassed pipeline for simple aggregate functions
            // This code created measure references like '[Measures].[Name]' instead of
            // properly converting through pipeline to get 'Sum([Measures].[Name])'
            // All expressions now go through the conversion pipeline in convertMeasures()
            /*
            if (aggFn !== "none" && isSimpleFunctionWithCol(exprLowerNoSpace)) {
              const measTblWithCol = bim.model.tables.find(
                (table) =>
                  exprLowerNoSpace.includes(
                    "(" + lowerNoSpace(table.name) + "[",
                  ) ||
                  exprLowerNoSpace.includes(
                    "('" + lowerNoSpace(table.name) + "'[",
                  ),
              );
              if (measTblWithCol) {
                const bimColumn = measTblWithCol.columns.find(
                  (col) =>
                    exprLowerNoSpace.includes(
                      "[" + lowerNoSpace(col.name) + "]",
                    ) ||
                    exprLowerNoSpace.includes(
                      "['" + lowerNoSpace(col.name) + "']",
                    ),
                );
                if (bimColumn) {
                  const ref_meas_unique_name =
                    this.createAndAddMeasureFromColumn(
                      bimColumn,
                      measTblWithCol.name,
                      aggFn,
                      result,
                      attrMaps,
                      unusedTables,
                    );
                  const calc_unique_name = createUniqueAttrName(
                    attrMaps.attrNameMap,
                    meas.name,
                    makeUniqueName(`calculation.${bimMeasTable.name}.`) +
                      meas.name,
                    "calculation from BIM measure",
                    bimMeasTable.name,
                    "",
                    this.logger,
                  );
                  const newCalc: SMLMetricCalculated = {
                    object_type: SMLObjectType.MetricCalc,
                    unique_name: calc_unique_name,
                    description: descriptionAsString(meas.description),
                    label: meas.name,
                    folder: meas.displayFolder,
                    format: this.smlFormatFromBim(meas.formatString),
                    expression: `[Measures].[${ref_meas_unique_name}]`,
                  };

                  this.addSMLCalc(
                    newCalc,
                    result.models[0],
                    result,
                    attrMaps,
                    bimMeasTable,
                  );
                  console.log(`XXX Calc '${calc_unique_name}' from agg only`);
                }
              }
            }
            */
            if (
              aggFn === "countrows" &&
              isSimpleCountRowsFunction(exprLowerNoSpace)
            ) {
              const referencedTable = bim.model.tables.find(
                (check) =>
                  exprLowerNoSpace.includes(
                    "(" + lowerNoSpace(check.name) + ")",
                  ) ||
                  exprLowerNoSpace.includes(
                    "('" + lowerNoSpace(check.name) + "')",
                  ),
              );
              if (referencedTable) {
                let referencedMetric: string | undefined;
                if (
                  !attrMaps.metricLookup.get(
                    lowerNoSpace(
                      aggFn +
                        bimMeasTable.name +
                        "[" +
                        Constants.ROW_COUNT_COLUMN_NAME +
                        "]",
                    ),
                  )
                ) {
                  // Have to create the base measure since it doesn't already exist
                  // Countrows only references a table, no column, so handled differently
                  referencedMetric = this.createAndAddCountRowsMeasure(
                    referencedTable.name,
                    result,
                    attrMaps,
                    unusedTables,
                    meas.isHidden,
                  );
                  this.logger.info(
                    `An aggregation function of 'countrows' was found for bim measure '${meas.name}' on table '${bimMeasTable.name}'. A calculated column named '${Constants.ROW_COUNT_COLUMN_NAME}' will be created in the SML with a value of '1' and the converted metric '${referencedMetric}' will be a 'sum'`,
                  );
                } else {
                  referencedMetric = attrMaps.metricLookup.get(
                    lowerNoSpace(
                      aggFn +
                        bimMeasTable.name +
                        "[" +
                        Constants.ROW_COUNT_COLUMN_NAME +
                        "]",
                    ),
                  )?.uniqueName;
                }
                // Create the calculated metric referencing the countrows base measure for the table
                const calc_unique_name = createUniqueAttrName(
                  attrMaps.attrNameMap,
                  meas.name,
                  makeUniqueName(`calculation.${bimMeasTable.name}.`) +
                    meas.name,
                  "calculation from BIM measure",
                  bimMeasTable.name,
                  shortAggFn(aggFn),
                  this.logger,
                );
                const newCalc: SMLMetricCalculated = {
                  object_type: SMLObjectType.MetricCalc,
                  unique_name: calc_unique_name,
                  description: descriptionAsString(meas.description),
                  label: meas.name,
                  folder: meas.displayFolder,
                  format: this.smlFormatFromBim(meas.formatString),
                  expression: `[Measures].[${referencedMetric}]`,
                  is_hidden: meas.isHidden,
                };
                this.addSMLCalc(
                  newCalc,
                  result.models[0],
                  result,
                  attrMaps,
                  bimMeasTable,
                );
                console.log(`XXX Calc '${calc_unique_name}' count rows`);
              } else {
                this.logger.warn(
                  `Can't find table referenced by bim measure '${meas.name}' so the measure will not be created`,
                );
              }
            }
          }
        });
      });
  }

  /**
   * Create a measure from a column only if the column isn't used elsewhere, is visible, has summarizeBy
   * and isn't a known naming pattern. Only creates measures on fact tables, not dimension tables.
   */
  measuresFromColumns(
    bim: BimRoot,
    result: SmlConverterResult,
    model: SMLModel,
    attrMaps: AttributeMaps,
    unusedTables: Set<string>,
    tableLists: TableLists,
  ) {
    // Only create measures on fact tables, not dimension tables
    const factTableNames = new Set(tableLists.factTables.map((t) => t.name));
    if (bim.model.tables)
      bim.model.tables.filter((tbl) => factTableNames.has(tbl.name)).forEach((tbl) => {
        const usedCols: Set<string> = colsUsedByTbl(bim, result, tbl.name);
        tbl.columns?.forEach((col) => {
          if (
            !isHidden(col) &&
            doCreateSummary(col.name, col.summarizeBy) &&
            !usedCols.has(col.name)
          ) {
            const aggFn = col.summarizeBy?.toLowerCase();
            if (aggFn) {
              this.createAndAddMeasureFromColumn(
                col,
                tbl.name,
                aggFn,
                result,
                attrMaps,
                unusedTables,
              );
            }
          }
        });
      });
  }

  createAndAddMeasureFromColumn(
    c: BimTableColumn,
    tableName: string,
    aggFn: string,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
    unusedTables: Set<string>,
  ): string {
    const existing = attrMaps.metricLookup.get(
      aggFn + lowerNoSpace(tableName + "[" + c.name + "]"),
    );
    if (existing) return existing.uniqueName;

    const model = result.models[0];

    if (unusedTables.has(tableName)) return "";

    // Don't create metrics on dimension-only tables
    if (this.isDimensionTable(tableName)) {
      this.logger.debug?.(
        `Skipping metric creation for column '${c.name}' on dimension table '${tableName}'`,
      );
      return "";
    }

    const datasetUniqueName = makeUniqueName(`dataset.${tableName}`);
    const default_meas_name =
      makeUniqueName(`metric.${tableName}.`) +
      c.name +
      makeUniqueName(`.${aggFn}`);
    let measureUniqueName = lookupAttrUniqueName(
      attrMaps.attrNameMap,
      default_meas_name,
      false,
      this.logger,
    );

    if (!measureUniqueName) {
      measureUniqueName = createUniqueAttrName(
        attrMaps.attrNameMap,
        c.name,
        default_meas_name,
        "measure from column",
        tableName,
        shortAggFn(aggFn),
        this.logger,
      );
    }

    const modelMetric: SMLModelMetricsAndCalc = {
      unique_name: measureUniqueName,
      folder: c.displayFolder,
    };
    const countLabels = attrMaps.metricLabels.get(c.name.toLowerCase()) ?? 0;

    // If aggregation is countrows, use a calculated column with value 1
    // Change aggFn to sum
    let colToUse = c.name;
    if (aggFn.toLowerCase() === "countrows") {
      colToUse = Constants.ROW_COUNT_COLUMN_NAME;
      aggFn = "sum";
      this.logger.info(
        `An aggregation function of 'countrows' was found for column '${c.name}' on dataset '${datasetUniqueName}'. A calculated column named '${Constants.ROW_COUNT_COLUMN_NAME}' will be created in the SML with a value of '1' and the converted metric will be a 'sum'`,
      );
    }
    const measure: SMLMetric = {
      object_type: SMLObjectType.Metric,
      unique_name: measureUniqueName,
      dataset: datasetUniqueName,
      label:
        countLabels && countLabels > 0
          ? `${c.name} ${aggFn} on ${tableName}`
          : c.name,
      calculation_method:
        this.mapBimToSMLCalculationType(aggFn) || SMLCalculationMethod.Average,
      description: descriptionAsString(c.description),
      folder: c.displayFolder,
      format: this.smlFormatFromBim(c.formatString),
      column: colToUse,
      unrelated_dimensions_handling: SMLUnrelatedDimensionsHandling.Repeat,
    };

    if (aggFn.toLowerCase() !== "sum") {
      console.log(
        `XXX Meas '${measureUniqueName}' for column '${c.name}' using aggFn '${aggFn}'`,
      );
    }

    incrementNumberMap(attrMaps.metricLabels, c.name);

    result.measures.push(measure);
    if (!model.metrics.find((m) => m.unique_name === modelMetric.unique_name))
      model.metrics.push(modelMetric);

    attrMaps.metricLookup.set(
      lowerNoSpace(aggFn + tableName + "[" + c.name + "]"),
      {
        table: tableName,
        colName: c.name,
        uniqueName: measureUniqueName,
      },
    );
    return measureUniqueName;
  }

  createAndAddCountRowsMeasure(
    tableName: string,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
    unusedTables: Set<string>,
    isHidden: boolean,
  ): string {
    const existing = attrMaps.metricLookup.get(
      "countrows" +
        lowerNoSpace(tableName + "[" + Constants.ROW_COUNT_COLUMN_NAME + "]"),
    );
    if (existing) return existing.uniqueName;

    const model = result.models[0];
    if (unusedTables.has(tableName)) return "";

    const datasetUniqueName = makeUniqueName(`dataset.${tableName}`);
    const default_meas_name = makeUniqueName(
      `metric.${tableName}.${Constants.ROW_COUNT_COLUMN_NAME}.countrows`,
    );
    let measureUniqueName = lookupAttrUniqueName(
      attrMaps.attrNameMap,
      default_meas_name,
      false,
      this.logger,
    );
    if (!measureUniqueName) {
      measureUniqueName = createUniqueAttrName(
        attrMaps.attrNameMap,
        Constants.ROW_COUNT_COLUMN_NAME,
        default_meas_name,
        "measure from measure",
        tableName,
        "sum",
        this.logger,
      );
    }
    const modelMetric: SMLModelMetricsAndCalc = {
      unique_name: measureUniqueName,
    };
    const countLabels =
      attrMaps.metricLabels.get(Constants.ROW_COUNT_COLUMN_NAME) ?? 0;
    const aggFn = "sum";
    const measure: SMLMetric = {
      object_type: SMLObjectType.Metric,
      unique_name: measureUniqueName,
      dataset: datasetUniqueName,
      label:
        countLabels && countLabels > 0
          ? `${Constants.ROW_COUNT_COLUMN_NAME} ${aggFn} on ${tableName}`
          : Constants.ROW_COUNT_COLUMN_NAME,
      calculation_method:
        this.mapBimToSMLCalculationType(aggFn) || SMLCalculationMethod.Sum, // Will always be sum
      format: "#,##0",
      column: Constants.ROW_COUNT_COLUMN_NAME,
      unrelated_dimensions_handling: SMLUnrelatedDimensionsHandling.Repeat,
      is_hidden: isHidden ? true : undefined,
    };

    incrementNumberMap(attrMaps.metricLabels, Constants.ROW_COUNT_COLUMN_NAME);

    result.measures.push(measure);
    if (!model.metrics.find((m) => m.unique_name === modelMetric.unique_name))
      model.metrics.push(modelMetric);

    attrMaps.metricLookup.set(
      "countrows" +
        lowerNoSpace(tableName + "[" + Constants.ROW_COUNT_COLUMN_NAME + "]"),
      {
        table: tableName,
        colName: Constants.ROW_COUNT_COLUMN_NAME,
        uniqueName: measureUniqueName,
      },
    );
    return measureUniqueName;
  }

  /**
   * Converts BIM calculated measure to SML calculated metric using 5-stage pipeline:
   * Stage 1: Direct function conversion (1:1 DAX→MDX mappings)
   * Stage 2: Template conversion (DIVIDE, patterns)
   * Stage 3: VAR inline + retry stages 1-2
   * Stage 4: AI-powered DAX to MDX conversion (if --llmName provided)
   * Stage 5: Fallback TODO stub
   *
   * @param bim - Root BIM model
   * @param bimMeasure - BIM measure with DAX expression
   * @param bimTable - Parent table containing measure
   * @param result - Accumulator for SML objects
   * @param attrMaps - Attribute name mappings
   * @param rawCalcs - Set of raw calculation names
   * @param tableLists - Lists of table usage (fact/dim/unused)
   * @param fellOut - Array tracking measures that fell through to fallback
   * @returns SMLMetricCalculated or undefined if conversion fails completely
   */
  async metricFromCalc(
    bim: BimRoot,
    bimMeasure: BimMeasure,
    bimTable: BimTable,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
    rawCalcs: Set<string>,
    tableLists: TableLists,
    fellOut: Array<string>,
  ): Promise<SMLMetricCalculated | undefined> {
    // Debugging breakpoint for specific measure
    if (bimMeasure.name === "MaxPremiumYr") {
      console.log("break");
    }

    const daxExpression = removeComments(
      expressionAsString(bimMeasure.expression),
    );

    // Check for direct calculation group usage before attempting conversion
    const calcGroupReason = this.detectCalculationGroupUsage(daxExpression);
    if (calcGroupReason) {
      // Create unique name for calculated metric
      const calc_unique_name = createUniqueAttrName(
        attrMaps.attrNameMap,
        bimMeasure.name,
        makeUniqueName(`calculation.${bimTable.name}.`) + bimMeasure.name,
        "calculation from BIM measure",
        bimTable.name,
        "",
        this.logger,
      );

      this.logger.info(`Measure '${bimMeasure.name}' ${calcGroupReason} - marking as TODO`);

      // Return early with TODO marker
      const smlMetric: SMLMetricCalculated = {
        object_type: SMLObjectType.MetricCalc,
        unique_name: calc_unique_name,
        description: descriptionAsString(bimMeasure.description),
        label: bimMeasure.name,
        folder: bimMeasure.displayFolder,
        is_hidden: bimMeasure.isHidden,
        format: this.smlFormatFromBim(bimMeasure.formatString),
        expression: `0 /* TODO uses calculationgroup: ${calcGroupReason} */`,
      };

      rawCalcs.add(bimMeasure.name);
      tableLists.measTables.add(bimTable.name);
      return smlMetric;
    }

    // Check for transitive calculation group dependencies via tracker
    if (this.dependencyTracker) {
      const [usesCalcGroup, transitiveReason] = this.dependencyTracker.usesCalculationGroup(bimMeasure.name);
      if (usesCalcGroup && transitiveReason) {
        // Create unique name for calculated metric
        const calc_unique_name = createUniqueAttrName(
          attrMaps.attrNameMap,
          bimMeasure.name,
          makeUniqueName(`calculation.${bimTable.name}.`) + bimMeasure.name,
          "calculation from BIM measure",
          bimTable.name,
          "",
          this.logger,
        );

        this.logger.info(`Measure '${bimMeasure.name}' ${transitiveReason} - marking as TODO`);

        // Return early with TODO marker
        const smlMetric: SMLMetricCalculated = {
          object_type: SMLObjectType.MetricCalc,
          unique_name: calc_unique_name,
          description: descriptionAsString(bimMeasure.description),
          label: bimMeasure.name,
          folder: bimMeasure.displayFolder,
          is_hidden: bimMeasure.isHidden,
          format: this.smlFormatFromBim(bimMeasure.formatString),
          expression: `0 /* TODO uses calculationgroup: ${transitiveReason} */`,
        };

        rawCalcs.add(bimMeasure.name);
        tableLists.measTables.add(bimTable.name);
        return smlMetric;
      }
    }

    // Create pipeline first (needed for templateRegistry in context)
    const pipeline = new ConversionPipeline(this.logger, {
      aiEnabled: !!this.llmName,
      llmName: this.llmName,
      aiMinConfidence: 0.3,
    });

    // Create conversion context with templateRegistry for recursive template conversion
    const context = createConversionContext(
      bim,
      daxExpression,
      bimTable.name,
      result,
      attrMaps,
      tableLists.unusedTables,
      this,
      this.logger,
      pipeline.getTemplateRegistry(),
    );

    // Run through 5-stage pipeline with error handling
    let pipelineResult;
    try {
      pipelineResult = await pipeline.convert(daxExpression, context);
    } catch (error) {
      // If pipeline fails (e.g., VAR parsing errors), create fallback result with original DAX
      this.logger.warn(`Pipeline conversion failed for '${bimMeasure.name}': ${error}`);
      pipelineResult = {
        success: false,
        expression: `0 /* TODO: ${escapeForComment(daxExpression)} */`,
        category: ConversionCategory.UNCONVERTIBLE,
        stageName: "fallback",
      };
    }

    // Create unique name for calculated metric
    const calc_unique_name = createUniqueAttrName(
      attrMaps.attrNameMap,
      bimMeasure.name,
      makeUniqueName(`calculation.${bimTable.name}.`) + bimMeasure.name,
      "calculation from BIM measure",
      bimTable.name,
      "",
      this.logger,
    );

    // Build MDX expression from pipeline result
    let mdxExpression = pipelineResult.expression || `0 /* TODO: ${escapeForComment(daxExpression)} */`;

    if (pipelineResult.success && pipelineResult.category !== ConversionCategory.UNCONVERTIBLE) {
      const stageName = pipelineResult.stageName || "unknown";
      const varsInfo = pipelineResult.varsInlined
        ? ` (${pipelineResult.varsInlinedCount} VARs inlined)`
        : "";
      console.log(`Converted '${bimMeasure.name}' via ${stageName}${varsInfo}`);
    } else {
      // Track measures that required fallback stub
      fellOut.push(bimMeasure.name);
    }

    // Add table to measTables
    tableLists.measTables.add(bimTable.name);

    // Create SML metric calculated
    const smlMetric: SMLMetricCalculated = {
      object_type: SMLObjectType.MetricCalc,
      unique_name: calc_unique_name,
      description: descriptionAsString(bimMeasure.description),
      label: bimMeasure.name,
      folder: bimMeasure.displayFolder,
      is_hidden: bimMeasure.isHidden,
      format: this.smlFormatFromBim(bimMeasure.formatString),
      expression: mdxExpression,
    };

    // Add to rawCalcs if fallback
    if (pipelineResult.category === ConversionCategory.UNCONVERTIBLE) {
      rawCalcs.add(bimMeasure.name);
    }

    return smlMetric;
  }

  /**
   * Converts BIM measure with math-only expressions (no functions, just operators).
   * Handles patterns like: [Measure1] + [Measure2] * 3
   *
   * @param bim - Root BIM model
   * @param meas - BIM measure to convert
   * @param tableName - Parent table name
   * @param result - SML object accumulator
   * @param attrMaps - Attribute name mappings
   * @param unusedTables - Set of unused table names
   * @returns SMLMetricCalculated if conversion succeeds, undefined otherwise
   */
  convertMathOnlyCalc(
    bim: BimRoot,
    meas: BimMeasure,
    tableName: string,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
    unusedTables: Set<string>,
  ): SMLMetricCalculated | undefined {
    if (meas.expression) {
      const e = removeComments(expressionAsString(meas.expression));
      const newExprReturned = initialMetric(
        e,
        bim,
        tableName,
        result,
        attrMaps,
        unusedTables,
        this.logger,
      );
      if (newExprReturned && newExprReturned?.str1 && !newExprReturned.str2) {
        try {
          const calc_unique_name = createUniqueAttrName(
            attrMaps.attrNameMap,
            meas.name,
            makeUniqueName(`calculation.${tableName}.`) + meas.name,
            "calculation from BIM measure",
            tableName,
            "",
            this.logger,
          );
          const newCalc: SMLMetricCalculated = {
            object_type: SMLObjectType.MetricCalc,
            unique_name: calc_unique_name,
            description: descriptionAsString(meas.description),
            label: meas.name,
            folder: meas.displayFolder,
            // is_hidden: meas.isHidden,
            format: this.smlFormatFromBim(meas.formatString),
            expression: newExprReturned.str1,
          };
          return newCalc;
        } catch (e) {
          const msg = errorUtil.getErrorMessage(e);
          this.logger.error(msg);
        }
      }
    }
    return undefined;
  }

  /**
   * Converts BIM measure containing DIVIDE() function to SML calculated metric.
   * Handles both 2-arg and 3-arg DIVIDE patterns:
   * - DIVIDE(num, denom) → (num) / (denom)
   * - DIVIDE(num, denom, default) → Currently converts to (num) / (denom), ignores default
   *
   * @param bim - Root BIM model
   * @param meas - BIM measure with DIVIDE expression
   * @param tableName - Parent table name
   * @param result - SML object accumulator
   * @param attrMaps - Attribute name mappings
   * @param unusedTables - Set of unused table names
   * @returns SMLMetricCalculated if conversion succeeds, undefined otherwise
   */
  convertDivideCalc(
    bim: BimRoot,
    meas: BimMeasure,
    tableName: string,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
    unusedTables: Set<string>,
  ): SMLMetricCalculated | undefined {
    if (meas.expression) {
      const e = removeComments(expressionAsString(meas.expression));
      if (lowerNoSpace(e).startsWith("divide(")) {
        const numerator = initialMetric(
          e.substring(e.indexOf("(") + 1),
          bim,
          tableName,
          result,
          attrMaps,
          unusedTables,
          this.logger,
        );
        if (
          numerator?.str1 &&
          numerator.str2 &&
          lowerNoSpace(numerator.str2).startsWith(",")
        ) {
          // Remove single quotes and initial comma in remainder of expression
          const newExpr = numerator.str2.replace(",", "").replace(/[' ]/g, "");
          const denominator = initialMetric(
            newExpr,
            bim,
            tableName,
            result,
            attrMaps,
            unusedTables,
            this.logger,
          );
          if (denominator && lowerNoSpace(denominator.str1).endsWith(")")) {
            denominator.str1 = denominator.str1.substring(
              0,
              denominator.str1.lastIndexOf(")"),
            );
            if (denominator.str2.replace(/[' ]/g, "").length == 0) {
              // Nothing after simple divide
              try {
                const calc_unique_name = createUniqueAttrName(
                  attrMaps.attrNameMap,
                  meas.name,
                  makeUniqueName(`calculation.${tableName}.`) + meas.name,
                  "calculation from BIM measure",
                  tableName,
                  "",
                  this.logger,
                );

                // Add parentheses for clear execution
                let numerator1 = numerator.str1;
                if (
                  !lowerNoSpace(numerator.str1).startsWith("(") ||
                  !lowerNoSpace(numerator.str1).endsWith(")")
                )
                  numerator1 = `(${numerator.str1})`;
                let denominator1 = denominator.str1;
                if (
                  !lowerNoSpace(denominator.str1).startsWith("(") ||
                  !lowerNoSpace(denominator.str1).endsWith(")")
                )
                  denominator1 = `(${denominator.str1})`;

                const newCalc: SMLMetricCalculated = {
                  object_type: SMLObjectType.MetricCalc,
                  unique_name: calc_unique_name,
                  description: descriptionAsString(meas.description),
                  label: meas.name,
                  folder: meas.displayFolder,
                  format: this.smlFormatFromBim(meas.formatString),
                  expression: `${numerator1} / ${denominator1}`, // `[Measures].[${numerator.measName}] / [Measures].[${denominator.measName}]`,
                };
                return newCalc;
              } catch (e) {
                const msg = errorUtil.getErrorMessage(e);
                this.logger.error(msg);
              }
            }
          }
        }
      }
    }
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  /**
   * Creates fallback SML calculated metric with TODO stub.
   * Used when all other conversion methods fail.
   * Expression format: "0 / * {dax} TODO: Update with valid MDX expression * /"
   *
   * @param bimTable - Parent BIM table
   * @param bimMeasure - BIM measure to convert
   * @param rawCalcs - Set tracking raw calculation names
   * @param attrNameMap - Attribute name mapping
   * @returns SMLMetricCalculated with TODO placeholder expression
   */
  async convertCalculatedMeasure(
    bimTable: BimTable,
    bimMeasure: BimMeasure,
    rawCalcs: Set<string>,
    attrNameMap: Map<string, string[]>,
  ): Promise<SMLMetricCalculated> {
    const calc_unique_name = createUniqueAttrName(
      attrNameMap,
      bimMeasure.name,
      makeUniqueName(`calculation.${bimTable.name}.`) + bimMeasure.name,
      "calculation from BIM measure",
      bimTable.name,
      "",
      this.logger,
    );
    const mdxExpression = `0 /*${removeComments(
      expressionAsString(bimMeasure.expression),
    )} TODO: Update with valid MDX expression*/`;

    const measure: SMLMetricCalculated = {
      object_type: SMLObjectType.MetricCalc,
      unique_name: calc_unique_name,
      description: descriptionAsString(bimMeasure.description),
      label: bimMeasure.name,
      folder: bimMeasure.displayFolder,
      is_hidden: bimMeasure.isHidden,
      format: this.smlFormatFromBim(bimMeasure.formatString),
      expression: mdxExpression,
    };

    rawCalcs.add(bimMeasure.name);
    return measure;
  }

  /**
   * Converts DAX measure to MDX using AI/LLM (if --llmName flag provided).
   * Uses LLM (OpenAI, Anthropic, or Gemini) to translate complex DAX expressions.
   * Returns undefined if difficulty score > 0.7 (too complex for reliable conversion).
   *
   * @param bim - Root BIM model
   * @param meas - BIM measure with DAX expression
   * @param tableName - Parent table name
   * @param result - SML object accumulator
   * @param attrMaps - Attribute name mappings
   * @param tableLists - Lists of table usage
   * @returns SMLMetricCalculated if AI conversion succeeds, undefined otherwise
   */
  async convertDaxMeasureWithAI(
    bim: BimRoot,
    meas: BimMeasure,
    tableName: string,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
    tableLists: TableLists,
  ): Promise<SMLMetricCalculated | undefined> {
    if (this.llmName) {
      try {
        console.log(`Using AI to convert DAX measure '${meas.name}'`);
        let mdxExpression = await convertDaxToMdxWithAi(
          removeComments(expressionAsString(meas.expression)),
          this.llmName,
          this.logger,
        );

        if (!mdxExpression) {
          // It's empty, meaning low confidence and did not send conversion
          return undefined;
        }
        const usedTableColumns: Set<[string, string]> = getTableColumnFromDax(
          meas.expression,
        );
        for (const [tbl, col] of usedTableColumns) {
          // Add columns not in a used dimension as a degenerate dimension
          tableLists.degenDims.add(`${tbl}:${col}`);
        }

        const daxTokenizer = new DaxTokenizer();
        const tokens = daxTokenizer.tokenize(
          expressionAsString(meas.expression),
        );
        const functionTokens = daxTokenizer.getAllInstanceOf(
          FunctionToken,
          tokens,
        );
        for (const func of functionTokens) {
          getMeasureName(
            bim,
            func,
            tableName,
            result,
            attrMaps,
            tableLists.unusedTables,
            this,
          );
        }

        const { usedMeasures, updatedMdxExpression } =
          replaceUsedMeasures(mdxExpression);
        usedMeasures.forEach(([table, column]) =>
          this.usedColumnsInDax.add(`${table}:${column}`),
        );
        // Taken from Dimension Converter convertAndAddLevel
        // Add to attrNameMap so can be found when creating calc
        for (const [tbl, col] of usedMeasures) {
          let level_unique_name = col;
          const default_level_unique_name =
            makeUniqueName(`dimension.${tbl}.attr.`) + col;
          const existingName = lookupAttrUniqueName(
            attrMaps.attrNameMap,
            default_level_unique_name,
            false,
            this.logger,
          );
          if (!existingName) {
            attrMaps.attrNameMap.set(level_unique_name.toLowerCase(), [
              "level attribute",
              tbl,
            ]);
            attrMaps.attrNameMap.set(default_level_unique_name.toLowerCase(), [
              level_unique_name,
            ]);
          }
        }

        mdxExpression = updatedMdxExpression;

        const calc_unique_name = createUniqueAttrName(
          attrMaps.attrNameMap,
          meas.name,
          makeUniqueName(`calculation.${tableName}.`) + meas.name,
          "calculation from BIM measure",
          tableName,
          "",
          this.logger,
        );

        const newCalc: SMLMetricCalculated = {
          object_type: SMLObjectType.MetricCalc,
          unique_name: calc_unique_name,
          description: descriptionAsString(meas.description),
          label: meas.name,
          folder: meas.displayFolder,
          is_hidden: meas.isHidden,
          format: this.smlFormatFromBim(meas.formatString),
          expression: mdxExpression,
        };
        return newCalc;
      } catch (e) {
        this.logger.warn(
          `AI DAX to MDX conversion failed for measure '${meas.name}'`,
        );
      }
    }
    return undefined;
  }

  mapBimToSMLCalculationType(
    bimSummarizeBy?: string,
  ): SMLCalculationMethod | undefined {
    if (bimSummarizeBy != undefined) {
      switch (bimSummarizeBy.toLowerCase()) {
        case "sum":
          return SMLCalculationMethod.Sum;
        case "min":
          return SMLCalculationMethod.Minimum;
        case "max":
          return SMLCalculationMethod.Maximum;
        case "count":
          return SMLCalculationMethod.NonDistinctCount;
        case "average":
          return SMLCalculationMethod.Average;
        case "distinctcount":
          return SMLCalculationMethod.CountDistinct;
        case "distinctsum":
          return SMLCalculationMethod.SumDistinct;
        case "none":
          return undefined;
        default:
          this.logger.warn(
            `Unsupported bim calculation type of '${bimSummarizeBy}' found. Using sum instead`,
          );
      }
    }
    return SMLCalculationMethod.Sum;
  }

  /**
   * Converts a BIM format string to an SML format string.
   * If the format is a known named format (case-insensitive), converts it to lowercase.
   *
   * @param fmt - The BIM format string to convert
   * @returns The converted SML format string. Returns empty string if input is undefined
   */
  smlFormatFromBim(fmt: string | undefined): string {
    if (!fmt) return "";
    if (Constants.NAMED_FORMATS.includes(fmt.toLowerCase()))
      return fmt.toLowerCase();
    return fmt;
  }

  addSMLCalc(
    smlMetric: SMLMetricCalculated,
    model: SMLModel,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
    bimTable: BimTable,
  ) {
    const bimMeasName = smlMetric.label;
    if (
      !attrMaps.metricLookup.has(
        "calc" + lowerNoSpace(bimTable.name + "[" + bimMeasName + "]"),
      )
    ) {
      const modelMetric: SMLModelMetricsAndCalc = {
        unique_name: smlMetric.unique_name,
        folder: smlMetric?.folder,
      };
      if (
        !model.metrics.find((m) => m.unique_name === modelMetric.unique_name)
      ) {
        model.metrics.push(modelMetric);
      }
      result.measuresCalculated.push(smlMetric);
      attrMaps.metricLookup.set(
        "calc" + lowerNoSpace(bimTable.name + "[" + bimMeasName + "]"),
        {
          table: bimTable.name,
          colName: bimMeasName,
          uniqueName: smlMetric.unique_name,
        },
      );
    }
  }

  /**
   * Adds columns used in DAX expressions to the SML dimension as secondary attributes
   */
  addUsedColumnsToDimension(
    bim: BimRoot,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
  ) {
    // Add used columns as secondary attributes of dimension
    for (const key of this.usedColumnsInDax) {
      const [tbl, col] = key.split(":");
      const tableRef = bim.model.tables.find((table) => table.name === tbl);
      if (tableRef) {
        // Find the column within the table
        const colRef = tableRef.columns.find((column) => column.name === col);
        if (colRef) {
          // Find the dimension that the table was converted into
          const dimen = result.dimensions.find(
            (dim) => dim.label === tableRef.name,
          );
          if (
            dimen &&
            !dimen.hierarchies[0].levels
              .flatMap((l) => l.secondary_attributes)
              .find((a) => a?.unique_name === colRef.name)
          ) {
            const joinColumns: Array<string> = listRelationshipColumns(
              bim.model,
              tableRef,
            );
            const dimConverter = new DimensionConverter(this.logger);
            dimConverter.convertSecondaryAttribute(
              tableRef,
              colRef,
              dimen,
              attrMaps.attrNameMap,
              joinColumns[0],
              true,
            );
            return;
          }
        }
      }
      this.logger.warn(
        `Column ${col} was unable to be added to dimension ${tbl}`,
      );
    }
  }
}
