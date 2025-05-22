"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.columnFromCalc = exports.DbtConverter = void 0;
const sdk_1 = require("sdk");
const ConvertResult_1 = require("../../shared/ConvertResult");
const Guard_1 = __importDefault(require("../../shared/Guard"));
const dbt_calculations_1 = require("./dbt-calculations");
const dbt_constants_1 = require("./dbt-constants");
const dbt_tools_1 = require("./dbt-tools");
class DbtConverter {
    constructor(dependencies) {
        this.logger = dependencies.logger;
    }
    process(rootFolder, input) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Logger initiated with: ${JSON.stringify(input)}`);
            // TODO Parse repo
            const objectIndex = {};
            const smlObjects = this.convert(objectIndex, input);
            return {
                smlObjects,
            };
        });
    }
    convert(dbtIndex, input) {
        var _a;
        const result = new ConvertResult_1.ConvertResult();
        result.catalog = this.convertCatalog(dbtIndex);
        result.addModel(dbt_constants_1.DbtConstants.createSimpleModel(result));
        const dbType = input.dbType;
        if (!["bigquery", "snowflake"].includes(dbType))
            throw new Error(`Currently BigQuery and Snowflake are supported for DBT conversion, not '${dbType}'`);
        // result.catalog.unique_name = `${result.catalog.label}_${dbType}`;
        const dbNameUpper = dbUpper(dbtIndex, dbType);
        const schemaNameUpper = schemaUpper(dbtIndex, dbType);
        const identifiersNameUpper = colsUpper(dbtIndex, dbType);
        const connection = this.convertConnection(input, dbType, dbNameUpper, schemaNameUpper);
        result.addConnection(connection);
        const datasetsToCreate = listUsedDatasets(dbtIndex);
        datasetsToCreate.forEach((tbl) => result.addDatasets(this.convertDataset(tbl, connection, dbtIndex)));
        result.addDatasets(dbt_constants_1.DbtConstants.timeDataset(connection, dbType, identifiersNameUpper)); // connection.unique_name, connection.database, connection.schema,
        // DbtTools.connectionTypeFromId(connection.as_connection, connection.label )));
        this.addColumns(dbtIndex, result, this.logger, dbType);
        result.addDimension(dbt_constants_1.DbtConstants.timeDimension());
        this.addRelationshipsAndDimensions(dbtIndex, result);
        this.addSameTableRelationships(dbtIndex, result);
        this.addTimeRelationships(dbtIndex, result, this.logger);
        this.addDegenerateDimensions(dbtIndex, result);
        for (const dbtSemanticModel of dbtIndex.properties.semantic_models) {
            const datasetName = datasetFromSM(dbtSemanticModel.model, result).unique_name;
            // Add measures
            (_a = dbtSemanticModel.measures) === null || _a === void 0 ? void 0 : _a.forEach((m) => {
                if (m.agg.toLowerCase() === "percentile") {
                    this.logger.warn(`Skipping metric '${m.name}' because percentile metrics are not yet supported`);
                }
                else {
                    result.addMeasures(this.convertMeasure(m, datasetName));
                    if (!result.models[0].metrics.find((m2) => m2.unique_name === m.name)) {
                        result.models[0].metrics.push(DbtConverter.createReference(m.name, dbt_tools_1.DbtTools.initCap(dbt_tools_1.DbtTools.noPreOrSuffix(datasetName))));
                    }
                }
            });
        }
        const removedMetrics = new Set();
        dbtIndex.properties.metrics.forEach((m) => {
            // Need to find the referenced measure first then use its dataset
            const smlMetric = dbt_calculations_1.DbtCalculations.convertCalc(m, result, dbtIndex, removedMetrics, this.logger);
            if (smlMetric != null) {
                if (dbt_tools_1.DbtTools.isCalculated(smlMetric) &&
                    !result.measuresCalculated.find((m) => m.unique_name === smlMetric.unique_name)) {
                    result.addMeasuresCalc(smlMetric);
                }
                else if (!result.measures.find((m) => m.unique_name === smlMetric.unique_name)) {
                    result.addMeasures(smlMetric);
                }
                if (!result.models[0].metrics.find((m2) => m2.unique_name == smlMetric.unique_name)) {
                    result.models[0].metrics.push(DbtConverter.createReference(smlMetric.unique_name, "Other Calculations"));
                }
            }
        });
        metricRemoval(result, removedMetrics, this.logger);
        applyCaseSensitivity(result, identifiersNameUpper);
        return result.getResult();
    }
    addDegenerateDimensions(dbtIndex, result) {
        var _a;
        for (const semanticModel of dbtIndex.properties.semantic_models) {
            if (semanticModel.dimensions && semanticModel.measures) {
                // If only dimensions and no relationship to it, won't create
                if (!result.dimensions.find((dim) => dim.unique_name === `Dim ${dbt_tools_1.DbtTools.refOnly(dbt_tools_1.DbtTools.makeStringValue(semanticModel.model))}`)) {
                    const datasetName = datasetFromSM(semanticModel.model, result).unique_name;
                    for (const dim of semanticModel.dimensions) {
                        if (dim.type != "time") {
                            result.addDimension(this.convertDegenerateDim(dim, datasetName, dbt_tools_1.DbtTools.initCap(datasetName)));
                            if (!result.models[0].dimensions)
                                result.models[0].dimensions = [];
                            (_a = result.models[0].dimensions) === null || _a === void 0 ? void 0 : _a.push(dbt_tools_1.DbtTools.dimName(dim.name));
                        }
                    }
                }
            }
        }
    }
    static createReference(nm, folder) {
        const modelMetric = {
            unique_name: nm,
            folder: folder,
        };
        return modelMetric;
    }
    addTimeRelationships(dbtIndex, result, logger) {
        for (const leftSemanticModel of dbtIndex.properties.semantic_models) {
            if (leftSemanticModel.dimensions && leftSemanticModel.measures) {
                // Only create from fact datasets for now
                leftSemanticModel.dimensions.forEach((dimCol) => {
                    if (dimCol.type === "time") {
                        // Create fact relationship
                        const model = result.models[0];
                        const leftDatasetUniqueName = dbt_tools_1.DbtTools.dsName(dbt_tools_1.DbtTools.refOnly(dbt_tools_1.DbtTools.makeStringValue(leftSemanticModel.model)));
                        if ("type_params" in dimCol &&
                            dimCol.type_params.time_granularity &&
                            !(dimCol.type_params.time_granularity === "day")) {
                            logger.warn(`Time granularity value of '${dimCol.type_params.time_granularity}' found but only 'day' is supported at present for dimension '${dimCol.name}' so relationship to Date Dimension will not be created for dim '${dimCol.name}' on dataset '${leftDatasetUniqueName}'`);
                        }
                        else {
                            const newRelationship = {
                                unique_name: `${leftDatasetUniqueName}_Date Dimension_${dimCol.name}`, // leftDatasetUniqueName + "_" + "Date Dimension" + "_" + dim.name,
                                from: {
                                    dataset: leftDatasetUniqueName,
                                    join_columns: [dimCol.name],
                                },
                                to: {
                                    dimension: "Date Dimension", // DbtConstants.TIME_DIM_NAME,
                                    level: "DayMonth", // DbtConstants.TIME_DIM_JOIN_LEVEL,
                                },
                                role_play: dimCol.name + " {0}",
                            };
                            model.relationships.push(newRelationship);
                        }
                    }
                });
            }
        }
    }
    addRelationshipsAndDimensions(dbtIndex, result) {
        for (const leftSemanticModel of dbtIndex.properties.semantic_models) {
            if (leftSemanticModel.entities) {
                for (const leftEntity of leftSemanticModel.entities) {
                    if (leftEntity.type === "foreign") {
                        // const leftModelName = DbtTools.refOnly(DbtTools.makeStringValue(leftSemanticModel.model));
                        for (const rightSemanticModel of dbtIndex.properties.semantic_models) {
                            if (rightSemanticModel.entities) {
                                const rightModelName = dbt_tools_1.DbtTools.refOnly(dbt_tools_1.DbtTools.makeStringValue(rightSemanticModel.model));
                                for (const rightEntity of rightSemanticModel.entities) {
                                    if (rightEntity.type === "primary" && leftEntity.name === rightEntity.name) {
                                        // Create and add dimension, first getting the column
                                        const uniqueDimName = dbt_tools_1.DbtTools.dimName(rightModelName);
                                        if (result.dimensions.find((dim) => dim.unique_name === uniqueDimName))
                                            return;
                                        const colName = columnName(rightEntity.name, rightEntity.expr, defaultDataTypeFromColName(rightEntity.name), rightModelName, result);
                                        const newDim = {
                                            object_type: sdk_1.SMLObjectType.Dimension,
                                            unique_name: uniqueDimName,
                                            label: `Dim ${rightModelName}`,
                                            description: rightSemanticModel.description ||
                                                `This dimension was generated from a relationship to dbt model '${rightModelName}'`,
                                            level_attributes: [
                                                {
                                                    unique_name: rightEntity.name,
                                                    label: rightEntity.name,
                                                    dataset: dbt_tools_1.DbtTools.dsName(rightModelName),
                                                    key_columns: [dbt_tools_1.DbtTools.makeStringValue(colName)],
                                                    name_column: colName,
                                                },
                                            ],
                                            hierarchies: [
                                                {
                                                    unique_name: dbt_tools_1.DbtTools.initCap(rightModelName) + " Hierarchy",
                                                    label: dbt_tools_1.DbtTools.initCap(rightModelName) + " Hierarchy",
                                                    folder: dbt_tools_1.DbtTools.initCap(dbt_tools_1.DbtTools.noPreOrSuffix(rightModelName)),
                                                    levels: [
                                                        {
                                                            unique_name: rightEntity.name,
                                                            secondary_attributes: createOthers(rightSemanticModel.dimensions, dbt_tools_1.DbtTools.dsName(rightModelName), rightEntity.name),
                                                        },
                                                    ],
                                                },
                                            ],
                                        };
                                        // addSecondaryAttributes(newDim, )
                                        result.addDimension(newDim);
                                        // Create fact relationship
                                        const model = result.models[0];
                                        const leftDatasetUniqueName = dbt_tools_1.DbtTools.dsName(dbt_tools_1.DbtTools.refOnly(dbt_tools_1.DbtTools.makeStringValue(leftSemanticModel.model)));
                                        const newRelationship = {
                                            unique_name: leftDatasetUniqueName + "_" + uniqueDimName,
                                            from: {
                                                dataset: leftDatasetUniqueName,
                                                join_columns: [
                                                    columnName(leftEntity.name, leftEntity.expr, leftEntity.type, leftDatasetUniqueName, result),
                                                ],
                                            },
                                            to: {
                                                dimension: uniqueDimName,
                                                level: rightEntity.name,
                                            },
                                        };
                                        model.relationships.push(newRelationship);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        // Gather attribute names for lookup
        const attrSet = new Set();
        result.dimensions.forEach((dim) => {
            var _a;
            const leafLevel = dim.hierarchies[0].levels[dim.hierarchies[0].levels.length - 1];
            attrSet.add(leafLevel.unique_name);
            (_a = leafLevel.secondary_attributes) === null || _a === void 0 ? void 0 : _a.forEach((sec) => attrSet.add(sec.unique_name));
        });
        // Now add secondary attributes if they don't already exist
        result.dimensions.forEach((dim) => {
            var _a;
            for (const rightSemanticModel of dbtIndex.properties.semantic_models) {
                if (dbt_tools_1.DbtTools.dimName(rightSemanticModel.model) === dim.unique_name) {
                    const rightModelName = dbt_tools_1.DbtTools.refOnly(dbt_tools_1.DbtTools.makeStringValue(rightSemanticModel.model));
                    const leafLevel = dim.hierarchies[0].levels[dim.hierarchies[0].levels.length - 1];
                    (_a = rightSemanticModel.dimensions) === null || _a === void 0 ? void 0 : _a.forEach((d) => {
                        if (!leafLevel.secondary_attributes)
                            leafLevel.secondary_attributes = [];
                        // Check if it already exists
                        if (attrSet.has(d.name)) {
                            this.logger.warn(`Not creating secondary attribute '${d.name}' on '${rightModelName}' because attribute with same name already exists`);
                        }
                        else {
                            leafLevel.secondary_attributes.push(createSecondary(d, rightModelName));
                        }
                    });
                }
            }
        });
    }
    addSameTableRelationships(dbtIndex, result) {
        var _a, _b, _c;
        // If the same dataset already exists as a fact dataset, create a relationship to it
        const factDatasets = listFactDatasets(result, dbtIndex);
        for (const dim of result.dimensions) {
            if (((_a = dim.level_attributes) === null || _a === void 0 ? void 0 : _a.length) > 0 &&
                ((_b = dim.hierarchies) === null || _b === void 0 ? void 0 : _b.length) > 0 &&
                ((_c = dim.hierarchies[0].levels) === null || _c === void 0 ? void 0 : _c.length) > 0 &&
                factDatasets.has(dim.level_attributes[0].dataset)) {
                const joinLevel = dim.level_attributes.find((attr) => attr.unique_name === dim.hierarchies[0].levels[0].unique_name);
                if (joinLevel && "key_columns" in joinLevel) {
                    const dataset = dim.level_attributes[0].dataset;
                    // if (listFactDatasets(result).find((ds) => ds === rightModelName)) { // Has to be fact datasets, not all datasets. Use relationships
                    const newRelationship = {
                        unique_name: `${dataset}_${dim.unique_name}`,
                        from: {
                            dataset: dataset,
                            join_columns: joinLevel.key_columns,
                        },
                        to: {
                            dimension: dbt_tools_1.DbtTools.dimName(dataset),
                            level: joinLevel.unique_name,
                        },
                    };
                    result.models[0].relationships.push(newRelationship);
                }
            }
        }
    }
    mergeDbtProperties(target, source) {
        Object.keys(target).forEach((propName) => {
            const sourceValue = source[propName];
            const targetValue = target[propName];
            if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
                targetValue.push(...sourceValue);
            }
        });
    }
    convertDegenerateDim(d, datasetName, folder) {
        const degen = {
            object_type: sdk_1.SMLObjectType.Dimension,
            unique_name: dbt_tools_1.DbtTools.dimName(d.name),
            label: `Dim ${d.name}`,
            description: d.description,
            is_degenerate: true,
            level_attributes: [
                {
                    unique_name: d.name,
                    label: d.name,
                    description: d.description,
                    dataset: dbt_tools_1.DbtTools.dsName(datasetName),
                    name_column: dbt_tools_1.DbtTools.hasStringValue(d.expr) ? d.expr : d.name,
                    key_columns: [dbt_tools_1.DbtTools.hasStringValue(d.expr) ? d.expr : d.name],
                },
            ],
            hierarchies: [
                {
                    unique_name: `${d.name}_Hierarchy`,
                    label: `${d.name}_Hierarchy`,
                    folder: dbt_tools_1.DbtTools.noPreOrSuffix(folder),
                    levels: [{ unique_name: d.name }],
                },
            ],
        };
        return degen;
    }
    convertCatalog(dbtIndex) {
        return {
            version: 1.0,
            label: dbtIndex.project.name,
            object_type: sdk_1.SMLObjectType.Catalog,
            unique_name: dbtIndex.project.name + ".catalog",
            aggressive_agg_promotion: false,
            build_speculative_aggs: false,
        };
    }
    convertConnection(input, dbType, dbNameUpper, schemaNameUpper) {
        let db = input.database;
        let schema = input.schema;
        if (dbNameUpper)
            db = db.toLocaleUpperCase();
        if (schemaNameUpper)
            schema = schema.toLocaleUpperCase();
        return {
            object_type: sdk_1.SMLObjectType.Connection,
            unique_name: `dbt_connection_${input.atscaleConnectionId}`,
            as_connection: input.atscaleConnectionId,
            database: db,
            schema: schema,
            label: `DBT ${input.dbType} Connection ${input.atscaleConnectionId}`,
        };
    }
    convertDataset(tbl, connection, dbtIndex) {
        var _a;
        const description = (_a = dbtIndex.properties.models.find((m) => m.name.localeCompare(tbl) == 0)) === null || _a === void 0 ? void 0 : _a.description;
        const dataset = {
            object_type: sdk_1.SMLObjectType.Dataset,
            unique_name: dbt_tools_1.DbtTools.dsName(tbl), // TODO: For Snowflake use .toLocaleUpperCase()
            table: tbl,
            connection_id: connection.unique_name,
            label: dbt_tools_1.DbtTools.dsName(tbl),
            columns: [],
            description: description,
        };
        return dataset;
    }
    addColumns(dbtIndex, result, logger, dbType) {
        for (const dbtSemanticModel of dbtIndex.properties.semantic_models) {
            const dataset = result.datasets.find((ds) => ds.unique_name.localeCompare(dbt_tools_1.DbtTools.dsName(dbt_tools_1.DbtTools.refOnly(dbtSemanticModel.model))) === 0);
            if (dataset) {
                // Add columns and data types for relationships
                if (dbtSemanticModel.entities) {
                    for (const entity of dbtSemanticModel.entities) {
                        this.addColumnOrUpdateDatatype(dataset, entity.name, defaultDataTypeFromColName(entity.name), dbt_tools_1.DbtTools.hasStringValue(entity.expr) ? entity.expr : "", dbType);
                    }
                }
                // Add columns and data types for dimension attributes
                if (dbtSemanticModel.dimensions) {
                    for (const dim of dbtSemanticModel.dimensions) {
                        if (dim && "type_params" in dim && dim.type_params.time_granularity) {
                            if (!(dim.type_params.time_granularity === "day")) {
                                logger.warn(`Time granularity value of '${dim.type_params.time_granularity}' found but only 'day' is supported at present for dimension '${dim.name}'`);
                            }
                            this.addColumnOrUpdateDatatype(dataset, dim.name, "datetime", dbt_tools_1.DbtTools.hasStringValue(dim.expr) ? dim.expr : "", dbType);
                        }
                        else {
                            this.addColumnOrUpdateDatatype(dataset, dim.name, defaultDataTypeFromColName(dim.name), dbt_tools_1.DbtTools.hasStringValue(dim.expr) ? dim.expr : "", dbType);
                        }
                    }
                }
                // Add columns and data types for measures
                if (dbtSemanticModel.measures) {
                    for (const meas of dbtSemanticModel.measures) {
                        this.addColumnOrUpdateDatatype(dataset, meas.name, this.mapAggToColumnDataType(meas.agg, meas.name), dbt_tools_1.DbtTools.makeStringValue(meas.expr).length > 0 ? dbt_tools_1.DbtTools.makeStringValue(meas.expr) : "", dbType);
                    }
                }
            }
        }
    }
    convertMeasure(dbtMeasure, datasetName) {
        const metric = {
            object_type: sdk_1.SMLObjectType.Metric,
            unique_name: dbtMeasure.name,
            label: dbtMeasure.name,
            dataset: dbt_tools_1.DbtTools.dsName(datasetName),
            folder: dbt_tools_1.DbtTools.initCap(dbt_tools_1.DbtTools.noPreOrSuffix(datasetName)),
            column: dbtMeasure.name,
            calculation_method: dbt_tools_1.DbtTools.mapAggregation(dbtMeasure.agg, dbtMeasure.name, this.logger),
            description: dbtMeasure.description,
            unrelated_dimensions_handling: sdk_1.SMLUnrelatedDimensionsHandling.Repeat,
        };
        return metric;
    }
    mapAggToColumnDataType(agg, measName) {
        if (agg.includes("count") || agg.includes("COUNT"))
            return sdk_1.SMLColumnDataType.String;
        if (measName.toLowerCase().startsWith("count") || measName.toLowerCase().endsWith("count"))
            return sdk_1.SMLColumnDataType.Long;
        return sdk_1.SMLColumnDataType.Decimal;
    }
    // Checks if column name exists in dataset. If so replaces it with incoming data type'
    // If it doesn't exist add the column
    addColumnOrUpdateDatatype(smlDataset, name, datatype, expr, dbType) {
        // TODO: Remove this workaround when appropriate. It's only needed for the sample repo that is meant to run in Snowflake
        // but we want to run it in BigQuery.
        if (dbType.localeCompare("bigquery") == 0 &&
            `cast(${name} as DATETIME)`.toLowerCase().replace(/\s+/g, "") === expr.toLowerCase().replace(/\s+/g, "")) {
            expr = "";
        }
        // Name is same as expression
        const foundColumn = smlDataset.columns.find((c) => c.name.localeCompare(name) === 0 &&
            "data_type" in c &&
            datatype === c.data_type &&
            "expr" in c &&
            c.expr &&
            c.expr.toString().replace(/\s+/g, "") === expr.replace(/\s+/g, ""));
        if (foundColumn)
            return;
        const newColumn = {
            name: name,
            data_type: datatype,
        };
        if (expr && expr != name)
            newColumn.sql = expr;
        // Remove existing column then add new
        const smlColumn = smlDataset.columns.find((c) => c.name.localeCompare(name) === 0);
        if (smlColumn) {
            const index = smlDataset.columns.indexOf(smlColumn);
            if (index > -1) {
                smlDataset.columns.splice(index, 1);
            }
        }
        smlDataset.columns.push(newColumn);
    }
}
exports.DbtConverter = DbtConverter;
function defaultDataTypeFromColName(name) {
    if (name.startsWith("is_"))
        return "boolean";
    // if (name.startsWith("count") || name.endsWith("count")) return "long";
    return "string";
}
function listUsedDatasets(dbtIndex) {
    const datasetsToCreate = new Set();
    // Find used tables then add datasets
    Guard_1.default.ensure(dbtIndex.properties.semantic_models, "No semantic_models found in DBT repo so SML will not be created");
    for (const dbtSemanticModel of dbtIndex.properties.semantic_models) {
        Guard_1.default.ensure(dbtSemanticModel.model, `No model found for semantic_model '${dbtSemanticModel.name}'`);
        datasetsToCreate.add(dbt_tools_1.DbtTools.refOnly(dbtSemanticModel.model));
    }
    Guard_1.default.ensure(datasetsToCreate.size > 0, "No referenced tables found in semantic_models to create");
    return datasetsToCreate;
}
function datasetFromSM(model, result) {
    const dataset = result.datasets.find((ds) => ds.unique_name.localeCompare(dbt_tools_1.DbtTools.dsName(dbt_tools_1.DbtTools.refOnly(model))) === 0);
    if (dataset)
        return dataset;
    return dummyDatasetFromName(model);
}
function dummyDatasetFromName(dsName) {
    const dataset = {
        object_type: sdk_1.SMLObjectType.Dataset,
        unique_name: dbt_tools_1.DbtTools.dsName(dsName),
        connection_id: "",
        columns: [],
        label: "",
    };
    return dataset;
}
function columnName(colName, expr, dataType, modelName, result) {
    if (colName) {
        if (!dbt_tools_1.DbtTools.hasStringValue(expr) || (dbt_tools_1.DbtTools.hasStringValue(expr) && expr === colName))
            return colName;
        const dataset = result.datasets.find((ds) => ds.unique_name === dbt_tools_1.DbtTools.dsName(modelName));
        if (dataset) {
            return columnFromCalc(dataset, colName, expr, dataType);
        }
    }
    return "";
}
function columnFound(dataset, colName, expr) {
    const foundColumn = dataset.columns.find((c) => c.name.localeCompare(colName) === 0 &&
        "sql" in c &&
        c.sql &&
        c.sql.toString().replace(/\s+/g, "") === expr.replace(/\s+/g, ""));
    if (foundColumn)
        return true;
    return false;
}
function createSecondary(d, ds) {
    const secondary = {
        unique_name: d.name,
        label: d.name,
        dataset: ds,
        name_column: d.name,
        key_columns: [d.name],
    };
    return secondary;
}
function columnFromCalc(dataset, colName, expr, dataType) {
    if (columnFound(dataset, colName, expr))
        return colName;
    // Create new calculated column
    for (let i = 1; i < 1000; i++) {
        if (!columnFound(dataset, "calc_col" + i.toString, expr)) {
            const newName = "calc_col" + i.toString;
            const newColumn = {
                name: newName,
                data_type: dataType,
                sql: expr,
            };
            dataset.columns.push(newColumn);
            return newName;
        }
    }
    return "";
}
exports.columnFromCalc = columnFromCalc;
// Finds fact datasets which are ones that have a measure
function listFactDatasets(result, dbtIndex) {
    const dsSet = new Set();
    for (const dbtSemanticModel of dbtIndex.properties.semantic_models) {
        if (dbtSemanticModel && dbtSemanticModel.measures) {
            const ds = datasetFromSM(dbtSemanticModel.model, result);
            if (ds && "unique_name" in ds)
                dsSet.add(ds.unique_name);
        }
    }
    return dsSet;
}
function metricRemoval(result, removedMetrics, logger) {
    if (!result.measuresCalculated || removedMetrics.size === 0 || !result.measuresCalculated)
        return;
    const newRemovedMetrics = new Set();
    const newMeasures = [];
    const newReferences = [];
    // First remove them from model references
    result.models[0].metrics.forEach((m) => {
        if (!removedMetrics.has(m.unique_name))
            newReferences.push(m);
    });
    if (newReferences.length < result.models[0].metrics.length) {
        result.models[0].metrics.length = 0;
        result.models[0].metrics.push(...Array.from(newReferences));
    }
    // Now remove them from metrics and check if expressions reference them
    result.measuresCalculated.forEach((calc) => {
        removedMetrics.forEach((rm) => {
            if (calc.expression.includes(`[Measures].[${rm}]`))
                newRemovedMetrics.add(calc.unique_name);
        });
        if (removedMetrics.has(calc.unique_name)) {
            logger.warn(`Removing calculated metric '${calc.unique_name}' because it uses a removed metric`);
        }
        else {
            newMeasures.push(calc);
        }
    });
    if (newMeasures.length < result.measuresCalculated.length) {
        result.measuresCalculated.length = 0;
        result.measuresCalculated.push(...Array.from(newMeasures));
    }
    if (newRemovedMetrics.size > 0)
        metricRemoval(result, newRemovedMetrics, logger);
}
function dbUpper(dbtIndex, dbType) {
    if (dbType.localeCompare("snowflake") != 0)
        return false;
    if ("quoting" in dbtIndex.project && dbtIndex.project.quoting && typeof dbtIndex.project.quoting === "object") {
        if ("database" in dbtIndex.project.quoting && typeof dbtIndex.project.quoting.database === "boolean") {
            return !dbtIndex.project.quoting.database;
        }
    }
    return true;
}
function schemaUpper(dbtIndex, dbType) {
    if (dbType.localeCompare("snowflake") != 0)
        return false;
    if ("quoting" in dbtIndex.project && dbtIndex.project.quoting && typeof dbtIndex.project.quoting === "object") {
        if ("schema" in dbtIndex.project.quoting && typeof dbtIndex.project.quoting.schema === "boolean") {
            return !dbtIndex.project.quoting.schema;
        }
    }
    return true;
}
function colsUpper(dbtIndex, dbType) {
    if (dbType.localeCompare("snowflake") != 0)
        return false;
    if ("quoting" in dbtIndex.project && dbtIndex.project.quoting && typeof dbtIndex.project.quoting === "object") {
        if ("identifier" in dbtIndex.project.quoting && typeof dbtIndex.project.quoting.identifier === "boolean") {
            return !dbtIndex.project.quoting.identifier;
        }
    }
    return true;
}
// If the query engine is Snowflake often the db/schema/tables/columns will be created upper case but are
// considered case insensitive when querying in Snowflake. However AtScale treats all identifies as case
// sensitive so we need to potentially upper case them
function applyCaseSensitivity(result, identifiersNameUpper) {
    if (!identifiersNameUpper)
        return;
    result.datasets.forEach((ds) => {
        if (ds.table)
            ds.table = ds.table.toUpperCase();
        ds.columns.forEach((col) => {
            col.name = col.name.toLocaleUpperCase();
            if ("sql" in col && col.sql) {
                col.sql = typeof col.sql === "string" ? col.sql.toLocaleUpperCase() : undefined;
            }
        });
    });
    result.measures.forEach((m) => {
        m.column = m.column.toLocaleUpperCase();
    });
    result.dimensions.forEach((d) => {
        d.level_attributes.forEach((la) => {
            la.name_column = la.name_column.toLocaleUpperCase();
            if (la.sort_column)
                la.sort_column = la.sort_column.toLocaleUpperCase();
            la.key_columns.forEach(function (part, index, ary) {
                ary[index] = ary[index].toLocaleUpperCase();
            });
        });
        d.hierarchies.forEach((h) => {
            h.levels.forEach((l) => {
                if (l.secondary_attributes)
                    l.secondary_attributes.forEach((sec) => {
                        sec.name_column = sec.name_column.toLocaleUpperCase();
                        if (sec.sort_column)
                            sec.sort_column = sec.sort_column.toLocaleUpperCase();
                        if (sec.key_columns)
                            sec.key_columns.forEach(function (part, index, ary) {
                                ary[index] = ary[index].toLocaleUpperCase();
                            });
                    });
            });
        });
        if (d.relationships)
            d.relationships.forEach((rel) => {
                rel.from.join_columns.forEach(function (part, index, ary) {
                    ary[index] = ary[index].toLocaleUpperCase();
                });
            });
    });
    result.models[0].relationships.forEach((rel) => {
        rel.from.join_columns.forEach(function (part, index, ary) {
            ary[index] = ary[index].toLocaleUpperCase();
        });
    });
}
function createOthers(dimensions, datasetName, levelName) {
    if (!dimensions)
        return undefined;
    const list = [];
    // Create a secondary attribute for all but the level attribute
    dimensions
        .filter((d) => d.name.localeCompare(levelName) != 0)
        .forEach((d) => list.push(createSecondary(d, datasetName)));
    return list;
}
