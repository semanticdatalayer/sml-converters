import {
  SMLCalculationMethod,
  SMLMetric,
  SMLMetricCalculated,
  SMLModel,
  SMLModelMetricsAndCalc,
  SMLObjectType,
  SMLUnrelatedDimensionsHandling,
} from "sml-sdk";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import {
  BimMeasure,
  BimRoot,
  BimTable,
  BimTableColumn,
} from "../bim-models/bim-model";
import { shortAggFn } from "./bim-tools";
import { Constants } from "../bim-models/constants";
import { colsUsedByTbl, doCreateSummary } from "./converter-utils";
import {
  aggFunctionAtStart,
  initialMetric,
  isSimpleCountRowsFunction,
  isSimpleFunctionWithCol,
} from "./expression-parser";
import { makeUniqueName } from "./tools";
import {
  createUniqueAttrName,
  descriptionAsString,
  errorUtil,
  expressionAsString,
  incrementNumberMap,
  isHidden,
  lookupAttrUniqueName,
  lowerNoSpace,
  removeComments,
} from "./tools";
import { AttributeMaps, TableLists } from "../bim-models/types-and-interfaces";
import { Logger } from "../../../shared/logger";

export class MeasureConverter {
  private logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
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

            // Confirm table and column exist
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
                    expression: `[Measures].[${ref_meas_unique_name}]`, // `[Measures].[${numerator.measName}] / [Measures].[${denominator.measName}]`,
                  };

                  this.addSMLCalc(
                    newCalc,
                    result.models[0],
                    result,
                    attrMaps,
                    bimMeasTable,
                  );
                }
              }
            } else if (
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

  // Create a measure from a column only if the column isn't used elsewhere, is visible, has summarizeBy
  // and isn't a known naming pattern
  measuresFromColumns(
    bim: BimRoot,
    result: SmlConverterResult,
    model: SMLModel,
    attrMaps: AttributeMaps,
    unusedTables: Set<string>,
  ) {
    // Get list of fact tables from measures defined
    if (bim.model.tables)
      bim.model.tables.forEach((tbl) => {
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
      colToUse = Constants.ROW_COUNT_COLUMN_NAME; // createColForCountRows(result, datasetUniqueName);
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

  metricFromCalc(
    bim: BimRoot,
    bimMeasure: BimMeasure,
    bimTable: BimTable,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
    rawCalcs: Set<string>,
    tableLists: TableLists,
  ): SMLMetricCalculated | undefined {
    let smlMetric: SMLMetricCalculated | undefined = this.convertDivideCalc(
      bim,
      bimMeasure,
      bimTable.name,
      result,
      attrMaps,
      tableLists.unusedTables,
    );
    if (!smlMetric)
      smlMetric = this.convertMathOnlyCalc(
        bim,
        bimMeasure,
        bimTable.name,
        result,
        attrMaps,
        tableLists.unusedTables,
      );
    if (!smlMetric) {
      smlMetric = this.convertCalculatedMeasure(
        bimTable,
        bimMeasure,
        rawCalcs,
        attrMaps.attrNameMap,
      );
      tableLists.measTables.add(bimTable.name); // Don't have the actual dataset for most calcs
    }
    return smlMetric;
  }

  // BimMeasure -> SML Calc
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
          console.log(`ERROR message: ${msg}`);
        }
      }
    }
    return undefined;
  }

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
              // replace(")", "").
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
                console.log(`ERROR message: ${msg}`);
              }
            }
          }
        }
      }
    }
    return undefined;
  }

  convertCalculatedMeasure(
    bimTable: BimTable,
    bimMeasure: BimMeasure,
    rawCalcs: Set<string>,
    attrNameMap: Map<string, string[]>,
  ): SMLMetricCalculated {
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
    )}*/`;

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
}
