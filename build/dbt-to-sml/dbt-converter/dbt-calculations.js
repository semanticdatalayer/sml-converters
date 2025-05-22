"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbtCalculations = void 0;
const sdk_1 = require("sdk");
const dbt_converter_1 = require("./dbt-converter");
const dbt_tools_1 = require("./dbt-tools");
class DbtCalculations {
    static convertCalc(dbtMetric, result, dbtIndex, removedMetrics, logger) {
        var _a;
        let folder = "Other Calculations";
        let datasetName = "";
        let sql = "";
        let tp = {};
        let referencedMeasure = null;
        const existingMetric = result.measuresCalculated.find((c) => c.unique_name === dbtMetric.name);
        if (existingMetric) {
            existingMetric.description = dbtMetric.description || existingMetric.description;
            logger.info(`Metric named '${dbtMetric.name}' already exists so new instance will not be created`);
            return existingMetric;
        }
        let suffix = "";
        // If it references a single measure then use its folder
        if (dbtMetric && "type_params" in dbtMetric && dbtMetric.type_params) {
            tp = dbtMetric.type_params;
            if (tp && tp.measure) {
                const measure = dbt_tools_1.DbtTools.toObjectFromStringOrObject(tp.measure);
                if (measure && "name" in measure) {
                    // Can be string or object
                    referencedMeasure = result.measures.find((m) => m.unique_name === measure.name);
                    if (referencedMeasure) {
                        if (referencedMeasure.folder)
                            folder = dbt_tools_1.DbtTools.noPreOrSuffix(referencedMeasure.folder);
                        if (referencedMeasure.dataset)
                            datasetName = referencedMeasure.dataset;
                        if ("fill_nulls_with" in measure) {
                            sql = `CASE WHEN ISEMPTY([Measures].[${referencedMeasure.unique_name}]) THEN ${measure.fill_nulls_with} ELSE [Measures].[${referencedMeasure.unique_name}] END`;
                            suffix = "_fill_nulls"; // TODO: Add other suffixes and better checking for unique names
                        }
                    }
                }
            }
        }
        if (!("type" in dbtMetric) || !dbtMetric.type) {
            logger.warn(`DBT metric '${dbtMetric.name}' is missing required parameter of 'type' so it will not be created`);
            removedMetrics.add(dbtMetric.name);
            return null;
        }
        if (dbtMetric.type) {
            switch (dbtMetric.type) {
                case "conversion":
                    logger.warn(`Conversion metrics are not yet supported so metric '${dbtMetric.name}' will not be created`);
                    removedMetrics.add(dbtMetric.name);
                    return null;
                case "ratio":
                    if (!tp || !("numerator" in tp) || !("denominator" in tp)) {
                        logger.warn(`Ratio metric '${dbtMetric.name}' is missing a type parameter of numerator and/or denominator so it will not be created`);
                        removedMetrics.add(dbtMetric.name);
                        return null;
                    }
                    sql = `[Measures].[${tp.numerator}] / [Measures].[${tp.denominator}]`;
                    break;
                case "derived":
                    sql = DbtCalculations.dereferenceDerived(result, dbtMetric, dbtIndex, logger);
                    break;
                case "cumulative":
                    sql = DbtCalculations.dereferenceCumulative(result, dbtIndex, dbtMetric, logger);
                    break;
                case "simple": // Handled below
                    break;
                default:
                    logger.warn(`Metric type of '${dbtMetric.type}' is not supported so DBT metric '${dbtMetric.name}' will not be created`);
                    removedMetrics.add(dbtMetric.name);
                    return null;
            }
        }
        if (sql.length > 0) {
            // Check if calc name already exists as a measure or calc. If so, add suffix
            let newName = dbtMetric.name;
            if (result.measures.find((m) => m.unique_name == dbtMetric.name))
                newName = `${dbtMetric.name}${suffix}`;
            return {
                object_type: sdk_1.SMLObjectType.MetricCalc,
                unique_name: newName,
                label: newName,
                folder: dbt_tools_1.DbtTools.noPreOrSuffix(folder) || dbt_tools_1.DbtTools.initCap(dbt_tools_1.DbtTools.noPreOrSuffix(datasetName)),
                description: dbtMetric.description,
                expression: sql,
            };
        }
        let referencedDataset;
        // Simple metrics reference a measure in type_params and may or may not have a filter
        if (!dbtMetric.type || dbtMetric.type === "simple") {
            if (!referencedMeasure) {
                logger.warn(`DBT metric '${dbtMetric.name}' of type 'simple' is missing referenced measure or it can't be found so the metric will not be created`);
                removedMetrics.add(dbtMetric.name);
                return null;
            }
            referencedDataset = result.datasets.find((ds) => ds.unique_name === referencedMeasure.dataset);
            if (!referencedDataset) {
                logger.warn(`Can't find dataset for DBT metric '${dbtMetric.name}' so it will not be created`);
                removedMetrics.add(dbtMetric.name);
                return null;
            }
            const calcColForFilter = DbtCalculations.filterCalculation(dbtMetric, result, referencedMeasure, referencedDataset, dbtIndex, logger);
            if (!calcColForFilter.valid) {
                removedMetrics.add(dbtMetric.name);
                return null;
            }
            let colToUse;
            const colName = calcColForFilter.col || (referencedMeasure === null || referencedMeasure === void 0 ? void 0 : referencedMeasure.column) || dbtMetric.name;
            if (dbt_tools_1.DbtTools.isString(colName) && referencedDataset.columns.find((c) => c.name === colName)) {
                colToUse = colName;
            }
            else {
                logger.warn(`Can't find column to use for metric '${dbtMetric.name}' so it will not be created`);
                removedMetrics.add(dbtMetric.name);
                return null;
            }
            return {
                object_type: sdk_1.SMLObjectType.Metric,
                unique_name: dbtMetric.name,
                label: dbtMetric.name,
                folder: dbt_tools_1.DbtTools.initCap(dbt_tools_1.DbtTools.noPreOrSuffix(datasetName)),
                dataset: referencedDataset.unique_name,
                description: dbtMetric.description,
                column: colToUse,
                calculation_method: (_a = referencedMeasure === null || referencedMeasure === void 0 ? void 0 : referencedMeasure.calculation_method) !== null && _a !== void 0 ? _a : sdk_1.SMLCalculationMethod.Sum,
                unrelated_dimensions_handling: sdk_1.SMLUnrelatedDimensionsHandling.Repeat,
            };
        }
        removedMetrics.add(dbtMetric.name);
        return null;
    }
    // Returns the sql for a metric and adds a new metric if there's an offset window
    static dereferenceDerived(result, dbtMetric, dbtIndex, logger) {
        var _a;
        let sql = "";
        if (dbtMetric && "type_params" in dbtMetric && dbtMetric.type_params) {
            // if (dbtMetric.type_params.expr) sql = DbtTools.makeStringValue(dbtMetric.type_params.expr);
            sql = dbt_tools_1.DbtTools.makeStringValue(dbtMetric.type_params.expr);
            let offsetWindow;
            (_a = dbtMetric.type_params.metrics) === null || _a === void 0 ? void 0 : _a.forEach((m) => {
                const metric = dbt_tools_1.DbtTools.typeParamsToObject(m);
                if ("offset_window" in metric) {
                    offsetWindow = metric.offset_window;
                    if (!("alias" in metric)) {
                        logger.warn(`No alias found for measure '${dbtMetric.name}' with an offset_window so derived metric '${dbtMetric.name}' will not be created`);
                        return;
                    }
                    let hierarchyReference = "";
                    let attributeReference = "";
                    let folder = "";
                    const referencedMeasure = result.measures.find((m) => m.unique_name === metric.name);
                    if (referencedMeasure && referencedMeasure.folder)
                        folder = dbt_tools_1.DbtTools.noPreOrSuffix(referencedMeasure.folder);
                    const offset = offsetWindow.substring(0, offsetWindow.indexOf(" "));
                    const period = offsetWindow.substring(offsetWindow.indexOf(" ") + 1);
                    const rolePlayPrefix = rolePlayPrefixFromDbtMetric((referencedMeasure === null || referencedMeasure === void 0 ? void 0 : referencedMeasure.unique_name) || metric.name || dbtMetric.name, dbtIndex);
                    const dim = result.dimensions.find((d) => d.type === "time");
                    if (dim)
                        dim.hierarchies.forEach((h) => {
                            h.levels.forEach((l) => {
                                const levelAttribute = dim.level_attributes.find((lAttr) => lAttr.unique_name === l.unique_name);
                                if (dbt_tools_1.DbtTools.makeLower(periodToTimeTypes(period)).includes(dbt_tools_1.DbtTools.makeStringValue(levelAttribute === null || levelAttribute === void 0 ? void 0 : levelAttribute.time_unit))) {
                                    hierarchyReference = `[${rolePlayPrefix}${dim.unique_name}].[${rolePlayPrefix}${h.unique_name}]`;
                                    attributeReference = `[${rolePlayPrefix}${dim.unique_name}].[${rolePlayPrefix}${h.unique_name}].[${rolePlayPrefix}${l.unique_name}]`;
                                }
                            });
                        });
                    if (!hierarchyReference || !attributeReference) {
                        logger.warn(`Can't find hierarchy or level associated with period '${period}' so can't create derived metric '${dbtMetric.name}'`);
                        return;
                    }
                    result.addMeasuresCalc({
                        object_type: sdk_1.SMLObjectType.MetricCalc,
                        // TODO SDK Review why alias is optional
                        unique_name: metric.alias,
                        label: metric.alias,
                        folder: dbt_tools_1.DbtTools.noPreOrSuffix(folder) || "Other Calculations", // TODO: Check if all referenced measures are in same folder. If so, use it
                        description: `Calculation created from parent metric '${dbtMetric.name}'`,
                        expression: `CASE WHEN ISEMPTY([Measures].[${metric.name}]) THEN NULL ELSE (ParallelPeriod(${attributeReference}, ${offset}, ${hierarchyReference}.CurrentMember), [Measures].[${metric.name}]) END`,
                    });
                    if (!result.models[0].metrics.find((m) => m.unique_name === metric.alias)) {
                        result.models[0].metrics.push(dbt_converter_1.DbtConverter.createReference(dbt_tools_1.DbtTools.makeStringValue(metric.alias), "Other Calculations"));
                    }
                    const friendlyName = dbt_tools_1.DbtTools.makeStringValue(metric.alias || metric.name);
                    const regex = new RegExp(friendlyName, "g");
                    sql = sql.replace(regex, `[Measures].[${metric.alias}]`);
                }
                else {
                    // Use existing measure and reference as it's original name, not the alias
                    const friendlyName = dbt_tools_1.DbtTools.makeStringValue(metric.alias || metric.name);
                    const regex = new RegExp(friendlyName, "g");
                    sql = sql.replace(regex, `[Measures].[${metric.name}]`);
                }
            });
        }
        return sql;
    }
    static dereferenceCumulative(result, dbtIndex, dbtMetric, logger) {
        var _a, _b;
        let period = "year"; // Defaults if no window is defined
        // let numPeriods = 1;
        if (!dbtMetric.type_params.measure) {
            logger.warn(`Can't find referenced measure for cumulative metric '${dbtMetric.name}' so it will not be created`);
            return "";
        }
        let hierarchyReference = "";
        let attributeReference = "";
        let referencedMeasure;
        if (dbtMetric.type_params.measure)
            referencedMeasure = result.measures.find((m) => m.unique_name === dbtMetric.type_params.measure);
        if (!referencedMeasure) {
            (_a = dbtMetric.type_params.metrics) === null || _a === void 0 ? void 0 : _a.forEach((m) => {
                const metric = dbt_tools_1.DbtTools.typeParamsToObject(m);
                referencedMeasure = result.measures.find((m) => m.unique_name === metric.name);
            });
        }
        if ("window" in dbtMetric.type_params) {
            const components = (_b = dbtMetric.type_params.window) === null || _b === void 0 ? void 0 : _b.split(" ");
            if (components && components.length == 2) {
                const periodString = dbt_tools_1.DbtTools.makeStringValue(components[0]);
                if (dbt_tools_1.DbtTools.isInt(periodString) && Number(periodString) != 1) {
                    // TODO: Support other periods for cumulative
                    logger.warn(`Cumulative metric '${dbtMetric.name}' has period other than 1 specified which is not yet supported so it will not be created`);
                    return "";
                }
                period = components[1].toLowerCase().substring(0, components[1].length - 1);
                if (!["day", "week", "month", "quarter", "year"].includes(period)) {
                    logger.warn(`Invalid window specified for cumulative metric '${dbtMetric.name}' so it will not be created`);
                    return "";
                }
            }
            logger.warn(`Invalid window specified for cumulative metric '${dbtMetric.name}' so it will not be created`);
            return "";
        }
        const rolePlayPrefix = rolePlayPrefixFromDbtMetric((referencedMeasure === null || referencedMeasure === void 0 ? void 0 : referencedMeasure.unique_name) || dbtMetric.name, dbtIndex);
        const dim = result.dimensions.find((d) => d.type === "time");
        if (dim)
            dim.hierarchies.forEach((h) => {
                h.levels.forEach((l) => {
                    const levelAttribute = dim.level_attributes.find((lAttr) => lAttr.unique_name === l.unique_name);
                    if (dbt_tools_1.DbtTools.makeLower(periodToTimeTypes(period)).includes(dbt_tools_1.DbtTools.makeStringValue(levelAttribute === null || levelAttribute === void 0 ? void 0 : levelAttribute.time_unit))) {
                        hierarchyReference = `[${rolePlayPrefix}${dim.unique_name}].[${rolePlayPrefix}${h.unique_name}]`;
                        attributeReference = `[${rolePlayPrefix}${dim.unique_name}].[${rolePlayPrefix}${h.unique_name}].[${rolePlayPrefix}${l.unique_name}]`;
                    }
                });
            });
        if (!hierarchyReference || !attributeReference) {
            logger.warn(`Can't find hierarchy or level associated with period '${period}' so can't create derived metric '${dbtMetric.name}'`);
            return "";
        }
        return `CASE WHEN ISEMPTY([Measures].[${dbtMetric.type_params.measure}]) THEN NULL ELSE Aggregate(PeriodsToDate(${attributeReference}, ${hierarchyReference}.CurrentMember), [Measures].[${dbtMetric.type_params.measure}]) END`;
    }
    // Creates calculated column for filter if defined
    static filterCalculation(dbtMetric, result, referenceMeasure, referencedDataset, dbtIndex, logger) {
        const returnVal = { col: "", valid: false };
        if (!dbtMetric.filter) {
            returnVal.valid = true;
            return returnVal;
        }
        // Make sure filter uses the known form that references a dimension
        const lowerFilter = dbt_tools_1.DbtTools.makeLower(dbtMetric.filter);
        if (lowerFilter.split("dimension(").length != 2 ||
            lowerFilter.split("{{").length != 2 ||
            lowerFilter.split("}}").length != 2 ||
            lowerFilter.indexOf("{{") > lowerFilter.toLowerCase().indexOf("dimension(") ||
            lowerFilter.indexOf("dimension(") > lowerFilter.indexOf("}}") ||
            lowerFilter.includes("entity_path")) {
            logger.warn(`Skipping metric with filter '${dbtMetric.name}' because filter expression is not well formed or has features not yet supported`);
            return returnVal;
        }
        const fullRef = lowerFilter.substring(lowerFilter.indexOf("{{"), lowerFilter.indexOf("}}") + 2);
        const dbtModelRef = fullRef.substring(0, fullRef.indexOf("__"));
        const colRef = fullRef.substring(fullRef.indexOf("__") + 2, fullRef.indexOf("'", fullRef.indexOf("__") + 1));
        if (referencedDataset.unique_name != dbtModelRef) {
            logger.warn(`Skipping metric '${dbtMetric.name}' because dimension referenced in filter is on a different dataset from the referenced measure`);
            return returnVal;
        }
        // Check that dataset for referenced dimension column is the same as incoming dataset
        // If so can create calculated column. If not will need calculated measure (defer)
        dbtIndex.properties.semantic_models;
        if (!result.dimensions.find((d) => dbt_tools_1.DbtTools.dimName(colRef) === d.unique_name)) {
            logger.warn(`Skipping metric '${dbtMetric.name}' because dimension referenced in filter is not found`);
            return returnVal;
        }
        let dimExpr = "";
        dbtIndex.properties.semantic_models.forEach((sm) => {
            var _a;
            const dim = (_a = sm.dimensions) === null || _a === void 0 ? void 0 : _a.find((d) => d.name === colRef);
            if (dim && dbt_tools_1.DbtTools.isString(dim.expr)) {
                dimExpr = dim.expr;
            }
        });
        let dataType = "number";
        if (dbt_tools_1.DbtTools.makeLower(referenceMeasure.calculation_method).includes("count"))
            dataType = "integer";
        const newSql = `CASE WHEN ${dbtMetric.filter.replace(fullRef, dimExpr || colRef)} THEN ${dimExpr || referenceMeasure.unique_name} ELSE NULL END`;
        const col = (0, dbt_converter_1.columnFromCalc)(referencedDataset, colRef, newSql, dataType);
        if (dbt_tools_1.DbtTools.isString(col)) {
            returnVal.col = col;
            returnVal.valid = true;
        }
        return returnVal;
    }
}
exports.DbtCalculations = DbtCalculations;
function periodToTimeTypes(period) {
    switch (period.toLowerCase()) {
        case "day":
            return "time_days";
        case "week":
            return "time_weeks";
        case "month":
            return "time_months";
        case "quarter":
            return "time_quarters";
        case "halfyear":
            return "time_half_years";
        case "year":
            return "time_years";
    }
    return period;
}
function rolePlayPrefixFromDbtMetric(dbtMetricName, dbtIndex) {
    // Get the semantic model for the metric, then find the time column in the same semantic model
    for (const sm of dbtIndex.properties.semantic_models) {
        if (sm.dimensions && sm.measures) {
            // Only create from fact datasets for now
            if (sm.measures.find((m) => dbtMetricName === m.name)) {
                for (const dimCol of sm.dimensions) {
                    if (dimCol &&
                        "type" in dimCol &&
                        dimCol.type === "time" &&
                        "type_params" in dimCol &&
                        dimCol.type_params.time_granularity &&
                        dimCol.type_params.time_granularity === "day") {
                        return `${dimCol.name} `;
                    }
                }
            }
        }
    }
    return "";
}
