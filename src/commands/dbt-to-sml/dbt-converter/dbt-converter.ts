import {
  SMLCatalog,
  SMLColumnDataType,
  SMLConnection,
  SMLDataset,
  SMLDatasetColumnSimple,
  SMLDimension,
  SMLDimensionLevel,
  SMLDimensionSecondaryAttribute,
  SMLMetric,
  SMLMetricCalculated,
  SMLModelMetricsAndCalc,
  SMLModelRelationship,
  SMLObjectType,
  SMLUnrelatedDimensionsHandling,
} from "sml-sdk";

import { DWType } from "../../../shared/dw-types";
import {
  SmlConverterResult,
  SmlConvertResultBuilder,
} from "../../../shared/sml-convert-result";
import Guard from "../../../shared/guard";
import { Logger } from "../../../shared/logger";
import {
  DbtYamlDimension,
  DbtYamlFile,
  DbtYamlMeasure,
} from "../dbt-models/dbt-yaml.model";
import { IDbtConverterInput, IDbtIndex } from "../model";
import { DbtCalculations } from "./dbt-calculations";
import { DbtConstants } from "./dbt-constants";
import { DbtTools } from "./dbt-tools";
import { SmlConverterQuery } from "../../../shared/sml-converter-queries";
import { SmlUniqueNameGenerator } from "../../../shared/sml-unique-name-generator";

interface ISchemaMetadataService {
  getMetadata: (
    connectionId: string,
    database: string,
    schema: string,
    table: string,
  ) => Promise<string>;
}

export interface DbtConverterDependencies {
  logger: Logger;
  metadataService?: ISchemaMetadataService;
}

export class DbtConverter {
  private logger: Logger;
  private result = new SmlConvertResultBuilder();
  private smlQuery: SmlConverterQuery = SmlConverterQuery.for(this.result);
  private smlUniqueNameGenerator = SmlUniqueNameGenerator.fromQuery(
    this.smlQuery,
  );

  constructor(dependencies: DbtConverterDependencies) {
    this.logger = dependencies.logger;
  }

  convert(dbtIndex: IDbtIndex, input: IDbtConverterInput): SmlConverterResult {
    this.result.catalog = this.convertCatalog(dbtIndex);
    this.result.addModel(DbtConstants.createSimpleModel(this.result));

    const dbType: DWType = input.dbType;
    if (!["bigquery", "snowflake"].includes(dbType))
      throw new Error(
        `Currently BigQuery and Snowflake are supported for DBT conversion, not '${dbType}'`,
      );

    // result.catalog.unique_name = `${result.catalog.label}_${dbType}`;

    const dbNameUpper: boolean = dbUpper(dbtIndex, dbType);
    const schemaNameUpper: boolean = schemaUpper(dbtIndex, dbType);
    const identifiersNameUpper: boolean = colsUpper(dbtIndex, dbType);
    const connection = this.convertConnection(
      input,
      dbType,
      dbNameUpper,
      schemaNameUpper,
    );

    this.result.addConnection(connection);

    const datasetsToCreate: Set<string> = listUsedDatasets(dbtIndex);
    datasetsToCreate.forEach((tbl) =>
      this.result.addDatasets(this.convertDataset(tbl, connection, dbtIndex)),
    );

    this.result.addDatasets(
      DbtConstants.timeDataset(connection, dbType, identifiersNameUpper),
    ); // connection.unique_name, connection.database, connection.schema,
    // DbtTools.connectionTypeFromId(connection.as_connection, connection.label )));
    this.addColumns(dbtIndex, this.result, this.logger, dbType);

    this.result.addDimension(DbtConstants.timeDimension());
    this.addRelationshipsAndDimensions(dbtIndex);
    this.addSameTableRelationships(dbtIndex);
    this.addTimeRelationships(dbtIndex);
    this.addDegenerateDimensions(dbtIndex);

    for (const dbtSemanticModel of dbtIndex.properties.semantic_models) {
      const datasetName = datasetFromSM(
        dbtSemanticModel.model,
        this.result,
      ).unique_name;
      // Add measures
      dbtSemanticModel.measures?.forEach((m) => {
        if (m.agg.toLowerCase() === "percentile") {
          this.logger.warn(
            `Skipping metric '${m.name}' because percentile metrics are not yet supported`,
          );
        } else {
          const newMetric = this.convertMeasure(m, datasetName);
          this.result.addMeasures(newMetric);
          if (
            !this.result.models[0].metrics.find(
              (m2) => m2.unique_name === newMetric.unique_name,
            )
          ) {
            this.result.models[0].metrics.push(
              DbtConverter.createReference(
                newMetric.unique_name,
                DbtTools.initCap(DbtTools.noPreOrSuffix(datasetName)),
              ),
            );
          }
        }
      });
    }

    const removedMetrics = new Set<string>();
    dbtIndex.properties.metrics.forEach((m) => {
      // Need to find the referenced measure first then use its dataset
      const smlMetric = DbtCalculations.convertCalc(
        m,
        this.result,
        dbtIndex,
        removedMetrics,
        this.logger,
      );
      if (smlMetric != null) {
        if (
          DbtTools.isCalculated(smlMetric) &&
          !this.result.measuresCalculated.find(
            (m) => m.unique_name === smlMetric.unique_name,
          )
        ) {
          this.result.addMeasuresCalc(smlMetric as SMLMetricCalculated);
        } else if (
          !this.result.measures.find(
            (m) => m.unique_name === smlMetric.unique_name,
          )
        ) {
          this.result.addMeasures(smlMetric as SMLMetric);
        }
        if (
          !this.result.models[0].metrics.find(
            (m2) => m2.unique_name == smlMetric.unique_name,
          )
        ) {
          this.result.models[0].metrics.push(
            DbtConverter.createReference(
              smlMetric.unique_name,
              "Other Calculations",
            ),
          );
        }
      }
    });
    metricRemoval(this.result, removedMetrics, this.logger);

    applyCaseSensitivity(this.result, identifiersNameUpper);

    return this.result.getResult();
  }

  addDegenerateDimensions(dbtIndex: IDbtIndex) {
    for (const semanticModel of dbtIndex.properties.semantic_models) {
      if (semanticModel.dimensions && semanticModel.measures) {
        // If only dimensions and no relationship to it, won't create
        if (
          !this.result.dimensions.find(
            (dim) =>
              dim.unique_name ===
              `Dim ${DbtTools.refOnly(
                DbtTools.makeStringValue(semanticModel.model),
              )}`,
          )
        ) {
          const datasetName = datasetFromSM(
            semanticModel.model,
            this.result,
          ).unique_name;
          for (const dim of semanticModel.dimensions) {
            if (dim.type != "time") {
              this.result.addDimension(
                this.convertDegenerateDim(
                  dim,
                  datasetName,
                  DbtTools.initCap(datasetName),
                ),
              );
              if (!this.result.models[0].dimensions)
                this.result.models[0].dimensions = [];
              this.result.models[0].dimensions?.push(
                DbtTools.dimName(dim.name),
              );
            }
          }
        }
      }
    }
  }

  static createReference(nm: string, folder: string): SMLModelMetricsAndCalc {
    const modelMetric: SMLModelMetricsAndCalc = {
      unique_name: nm,
      folder: folder,
    };
    return modelMetric;
  }

  addTimeRelationships(dbtIndex: IDbtIndex) {
    for (const leftSemanticModel of dbtIndex.properties.semantic_models) {
      if (leftSemanticModel.dimensions && leftSemanticModel.measures) {
        // Only create from fact datasets for now
        leftSemanticModel.dimensions.forEach((dimCol) => {
          if (dimCol.type === "time") {
            // Create fact relationship
            const model = this.result.models[0];
            const leftDatasetUniqueName = DbtTools.dsName(
              DbtTools.refOnly(
                DbtTools.makeStringValue(leftSemanticModel.model),
              ),
            );

            if (
              "type_params" in dimCol &&
              dimCol.type_params.time_granularity &&
              !(dimCol.type_params.time_granularity === "day")
            ) {
              this.logger.warn(
                `Time granularity value of '${dimCol.type_params.time_granularity}' found but only 'day' is supported at present for dimension '${dimCol.name}' so relationship to Date Dimension will not be created for dim '${dimCol.name}' on dataset '${leftDatasetUniqueName}'`,
              );
            } else {
              const newRelationship: SMLModelRelationship = {
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

  addRelationshipsAndDimensions(dbtIndex: IDbtIndex) {
    for (const leftSemanticModel of dbtIndex.properties.semantic_models) {
      if (leftSemanticModel.entities) {
        for (const leftEntity of leftSemanticModel.entities) {
          if (leftEntity.type === "foreign") {
            // const leftModelName = DbtTools.refOnly(DbtTools.makeStringValue(leftSemanticModel.model));
            for (const rightSemanticModel of dbtIndex.properties
              .semantic_models) {
              if (rightSemanticModel.entities) {
                const rightModelName = DbtTools.refOnly(
                  DbtTools.makeStringValue(rightSemanticModel.model),
                );
                for (const rightEntity of rightSemanticModel.entities) {
                  if (
                    rightEntity.type === "primary" &&
                    leftEntity.name === rightEntity.name
                  ) {
                    // Create and add dimension, first getting the column
                    const uniqueDimName = DbtTools.dimName(rightModelName);
                    if (
                      this.result.dimensions.find(
                        (dim) => dim.unique_name === uniqueDimName,
                      )
                    )
                      return;
                    const colName = columnName(
                      rightEntity.name,
                      rightEntity.expr,
                      defaultDataTypeFromColName(rightEntity.name),
                      rightModelName,
                      this.result,
                    );

                    const level_unique_name =
                      this.smlUniqueNameGenerator.getNewUniqueNameForLevel(
                        rightEntity.name,
                      );
                    const newDim: SMLDimension = {
                      object_type: SMLObjectType.Dimension,
                      unique_name: uniqueDimName,
                      label: `Dim ${rightModelName}`,
                      description:
                        rightSemanticModel.description ||
                        `This dimension was generated from a relationship to dbt model '${rightModelName}'`,
                      level_attributes: [
                        {
                          unique_name: level_unique_name,
                          label: level_unique_name,
                          dataset: DbtTools.dsName(rightModelName),
                          key_columns: [DbtTools.makeStringValue(colName)],
                          name_column: colName,
                        },
                      ],
                      hierarchies: [
                        {
                          unique_name:
                            DbtTools.initCap(rightModelName) + " Hierarchy",
                          label:
                            DbtTools.initCap(rightModelName) + " Hierarchy",
                          folder: DbtTools.initCap(
                            DbtTools.noPreOrSuffix(rightModelName),
                          ),
                          levels: [
                            {
                              unique_name: level_unique_name,
                              secondary_attributes: createOthers(
                                rightSemanticModel.dimensions,
                                DbtTools.dsName(rightModelName),
                                level_unique_name,
                                this.smlUniqueNameGenerator,
                              ),
                            },
                          ],
                        },
                      ],
                    };

                    // addSecondaryAttributes(newDim, )
                    this.result.addDimension(newDim);

                    // Create fact relationship
                    const model = this.result.models[0];
                    const leftDatasetUniqueName = DbtTools.dsName(
                      DbtTools.refOnly(
                        DbtTools.makeStringValue(leftSemanticModel.model),
                      ),
                    );
                    const newRelationship: SMLModelRelationship = {
                      unique_name: leftDatasetUniqueName + "_" + uniqueDimName,
                      from: {
                        dataset: leftDatasetUniqueName,
                        join_columns: [
                          columnName(
                            leftEntity.name,
                            leftEntity.expr,
                            leftEntity.type,
                            leftDatasetUniqueName,
                            this.result,
                          ),
                        ],
                      },
                      to: {
                        dimension: uniqueDimName,
                        level: level_unique_name,
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
    const attrSet = new Set<string>();
    this.result.dimensions.forEach((dim) => {
      const leafLevel: SMLDimensionLevel =
        dim.hierarchies[0].levels[dim.hierarchies[0].levels.length - 1];
      attrSet.add(leafLevel.unique_name);
      leafLevel.secondary_attributes?.forEach((sec) =>
        attrSet.add(sec.unique_name),
      );
    });

    // Now add secondary attributes if they don't already exist
    this.result.dimensions.forEach((dim) => {
      for (const rightSemanticModel of dbtIndex.properties.semantic_models) {
        if (DbtTools.dimName(rightSemanticModel.model) === dim.unique_name) {
          const rightModelName = DbtTools.refOnly(
            DbtTools.makeStringValue(rightSemanticModel.model),
          );
          const leafLevel: SMLDimensionLevel =
            dim.hierarchies[0].levels[dim.hierarchies[0].levels.length - 1];
          rightSemanticModel.dimensions?.forEach((d) => {
            if (!leafLevel.secondary_attributes)
              leafLevel.secondary_attributes = [];
            // Check if it already exists
            if (attrSet.has(d.name)) {
              this.logger.warn(
                `Not creating secondary attribute '${d.name}' on '${rightModelName}' because attribute with same name already exists`,
              );
            } else {
              leafLevel.secondary_attributes.push(
                createSecondary(d, rightModelName, this.smlUniqueNameGenerator),
              );
            }
          });
        }
      }
    });
  }

  addSameTableRelationships(dbtIndex: IDbtIndex) {
    // If the same dataset already exists as a fact dataset, create a relationship to it
    const factDatasets = listFactDatasets(this.result, dbtIndex);
    for (const dim of this.result.dimensions) {
      if (
        dim.level_attributes?.length > 0 &&
        dim.hierarchies?.length > 0 &&
        dim.hierarchies[0].levels?.length > 0 &&
        factDatasets.has(dim.level_attributes[0].dataset)
      ) {
        const joinLevel = dim.level_attributes.find(
          (attr) =>
            attr.unique_name === dim.hierarchies[0].levels[0].unique_name,
        );
        if (joinLevel && "key_columns" in joinLevel) {
          const dataset: string = dim.level_attributes[0].dataset;

          // if (listFactDatasets(result).find((ds) => ds === rightModelName)) { // Has to be fact datasets, not all datasets. Use relationships
          const newRelationship: SMLModelRelationship = {
            unique_name: `${dataset}_${dim.unique_name}`,
            from: {
              dataset: dataset,
              join_columns: joinLevel.key_columns,
            },
            to: {
              dimension: DbtTools.dimName(dataset),
              level: joinLevel.unique_name,
            },
          };
          this.result.models[0].relationships.push(newRelationship);
        }
      }
    }
  }

  mergeDbtProperties(target: Required<DbtYamlFile>, source: DbtYamlFile): void {
    Object.keys(target).forEach((propName) => {
      const sourceValue = source[propName as keyof DbtYamlFile] as Array<any>;
      const targetValue = target[propName as keyof DbtYamlFile] as Array<any>;

      if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
        targetValue.push(...sourceValue);
      }
    });
  }

  convertDegenerateDim(
    d: DbtYamlDimension,
    datasetName: string,
    folder: string,
  ): SMLDimension {
    const level_unique_name =
      this.smlUniqueNameGenerator.getNewUniqueNameForLevel(d.name);
    const degen: SMLDimension = {
      object_type: SMLObjectType.Dimension,
      unique_name: DbtTools.dimName(d.name),
      label: `Dim ${d.name}`,
      description: d.description,
      is_degenerate: true,
      level_attributes: [
        {
          unique_name: level_unique_name,
          label: level_unique_name,
          description: d.description,
          dataset: DbtTools.dsName(datasetName),
          name_column: DbtTools.hasStringValue(d.expr) ? d.expr : d.name,
          key_columns: [DbtTools.hasStringValue(d.expr) ? d.expr : d.name],
        },
      ],
      hierarchies: [
        {
          unique_name: `${d.name}_Hierarchy`,
          label: `${d.name}_Hierarchy`,
          folder: DbtTools.noPreOrSuffix(folder),
          levels: [{ unique_name: level_unique_name }],
        },
      ],
    };

    return degen;
  }

  convertCatalog(dbtIndex: IDbtIndex): SMLCatalog {
    return {
      version: 1.0,
      label: dbtIndex.project.name,
      object_type: SMLObjectType.Catalog,
      unique_name: dbtIndex.project.name + ".catalog",
      aggressive_agg_promotion: false,
      build_speculative_aggs: false,
    };
  }

  convertConnection(
    input: IDbtConverterInput,
    dbType: DWType,
    dbNameUpper: boolean,
    schemaNameUpper: boolean,
  ): SMLConnection {
    let db: string = input.database;
    let schema: string = input.schema;
    if (dbNameUpper) db = db.toLocaleUpperCase();
    if (schemaNameUpper) schema = schema.toLocaleUpperCase();

    return {
      object_type: SMLObjectType.Connection,
      unique_name: `dbt_connection_${input.atscaleConnectionId}`,
      as_connection: input.atscaleConnectionId,
      database: db,
      schema: schema,
      label: `DBT ${input.dbType} Connection ${input.atscaleConnectionId}`,
    } satisfies SMLConnection;
  }

  convertDataset(
    tbl: string,
    connection: SMLConnection,
    dbtIndex: IDbtIndex,
  ): SMLDataset {
    const description = dbtIndex.properties.models.find(
      (m) => m.name.localeCompare(tbl) == 0,
    )?.description;
    const dataset: SMLDataset = {
      object_type: SMLObjectType.Dataset,
      unique_name: DbtTools.dsName(tbl), // TODO: For Snowflake use .toLocaleUpperCase()
      table: tbl,
      connection_id: connection.unique_name,
      label: DbtTools.dsName(tbl),
      columns: [],
      description: description,
    };

    return dataset;
  }

  addColumns(
    dbtIndex: IDbtIndex,
    result: SmlConverterResult,
    logger: DbtConverter["logger"],
    dbType: DWType,
  ) {
    for (const dbtSemanticModel of dbtIndex.properties.semantic_models) {
      const dataset = result.datasets.find(
        (ds) =>
          ds.unique_name.localeCompare(
            DbtTools.dsName(DbtTools.refOnly(dbtSemanticModel.model)),
          ) === 0,
      );
      if (dataset) {
        // Add columns and data types for relationships
        if (dbtSemanticModel.entities) {
          for (const entity of dbtSemanticModel.entities) {
            this.addColumnOrUpdateDatatype(
              dataset,
              entity.name,
              defaultDataTypeFromColName(entity.name),
              DbtTools.hasStringValue(entity.expr) ? entity.expr : "",
              dbType,
            );
          }
        }

        // Add columns and data types for dimension attributes
        if (dbtSemanticModel.dimensions) {
          for (const dim of dbtSemanticModel.dimensions) {
            if (
              dim &&
              "type_params" in dim &&
              dim.type_params.time_granularity
            ) {
              if (!(dim.type_params.time_granularity === "day")) {
                logger.warn(
                  `Time granularity value of '${dim.type_params.time_granularity}' found but only 'day' is supported at present for dimension '${dim.name}'`,
                );
              }
              this.addColumnOrUpdateDatatype(
                dataset,
                dim.name,
                "datetime",
                DbtTools.hasStringValue(dim.expr) ? dim.expr : "",
                dbType,
              );
            } else {
              this.addColumnOrUpdateDatatype(
                dataset,
                dim.name,
                defaultDataTypeFromColName(dim.name),
                DbtTools.hasStringValue(dim.expr) ? dim.expr : "",
                dbType,
              );
            }
          }
        }

        // Add columns and data types for measures
        if (dbtSemanticModel.measures) {
          for (const meas of dbtSemanticModel.measures) {
            this.addColumnOrUpdateDatatype(
              dataset,
              meas.name,
              this.mapAggToColumnDataType(meas.agg, meas.name),
              DbtTools.makeStringValue(meas.expr).length > 0
                ? DbtTools.makeStringValue(meas.expr)
                : "",
              dbType,
            );
          }
        }
      }
    }
  }

  convertMeasure(dbtMeasure: DbtYamlMeasure, datasetName: string): SMLMetric {
    const metric: SMLMetric = {
      object_type: SMLObjectType.Metric,
      unique_name: dbtMeasure.name,
      label: dbtMeasure.name,
      dataset: DbtTools.dsName(datasetName),
      folder: DbtTools.initCap(DbtTools.noPreOrSuffix(datasetName)),
      column: dbtMeasure.name,
      calculation_method: DbtTools.mapAggregation(
        dbtMeasure.agg,
        dbtMeasure.name,
        this.logger,
      ),
      description: dbtMeasure.description,
      unrelated_dimensions_handling: SMLUnrelatedDimensionsHandling.Repeat,
    };

    return metric;
  }

  private mapAggToColumnDataType(
    agg: string,
    measName: string,
  ): SMLColumnDataType {
    if (agg.includes("count") || agg.includes("COUNT"))
      return SMLColumnDataType.String;
    if (
      measName.toLowerCase().startsWith("count") ||
      measName.toLowerCase().endsWith("count")
    )
      return SMLColumnDataType.Long;
    return SMLColumnDataType.Decimal;
  }

  // Checks if column name exists in dataset. If so replaces it with incoming data type'
  // If it doesn't exist add the column
  private addColumnOrUpdateDatatype(
    smlDataset: SMLDataset,
    name: string,
    datatype: string,
    expr: string,
    dbType: string,
  ): void {
    // TODO: Remove this workaround when appropriate. It's only needed for the sample repo that is meant to run in Snowflake
    // but we want to run it in BigQuery.
    if (
      dbType.localeCompare("bigquery") == 0 &&
      `cast(${name} as DATETIME)`.toLowerCase().replace(/\s+/g, "") ===
        expr.toLowerCase().replace(/\s+/g, "")
    ) {
      expr = "";
    }

    // Name is same as expression
    const foundColumn = smlDataset.columns.find(
      (c) =>
        c.name.localeCompare(name) === 0 &&
        "data_type" in c &&
        datatype === c.data_type &&
        "expr" in c &&
        c.expr &&
        c.expr.toString().replace(/\s+/g, "") === expr.replace(/\s+/g, ""),
    );
    if (foundColumn) return;

    const newColumn: SMLDatasetColumnSimple = {
      name: name,
      data_type: datatype,
    };
    if (expr && expr != name) newColumn.sql = expr;

    // Remove existing column then add new
    const smlColumn = smlDataset.columns.find(
      (c) => c.name.localeCompare(name) === 0,
    );
    if (smlColumn) {
      const index = smlDataset.columns.indexOf(smlColumn);
      if (index > -1) {
        smlDataset.columns.splice(index, 1);
      }
    }
    smlDataset.columns.push(newColumn);
  }
}

function defaultDataTypeFromColName(name: string): string {
  if (name.startsWith("is_")) return "boolean";
  // if (name.startsWith("count") || name.endsWith("count")) return "long";
  return "string";
}

function listUsedDatasets(dbtIndex: IDbtIndex): Set<string> {
  const datasetsToCreate = new Set<string>();

  // Find used tables then add datasets
  Guard.ensure(
    dbtIndex.properties.semantic_models,
    "No semantic_models found in DBT repo so SML will not be created",
  );

  for (const dbtSemanticModel of dbtIndex.properties.semantic_models) {
    Guard.ensure(
      dbtSemanticModel.model,
      `No model found for semantic_model '${dbtSemanticModel.name}'`,
    );
    datasetsToCreate.add(DbtTools.refOnly(dbtSemanticModel.model));
  }
  Guard.ensure(
    datasetsToCreate.size > 0,
    "No referenced tables found in semantic_models to create",
  );

  return datasetsToCreate;
}

function datasetFromSM(
  model: string,
  result: SmlConvertResultBuilder,
): SMLDataset {
  const dataset = result.datasets.find(
    (ds) =>
      ds.unique_name.localeCompare(DbtTools.dsName(DbtTools.refOnly(model))) ===
      0,
  );
  if (dataset) return dataset;
  return dummyDatasetFromName(model);
}

function dummyDatasetFromName(dsName: string): SMLDataset {
  const dataset: SMLDataset = {
    object_type: SMLObjectType.Dataset,
    unique_name: DbtTools.dsName(dsName),
    connection_id: "",
    columns: [],
    label: "",
  };
  return dataset;
}

function columnName(
  colName: string,
  expr: string | boolean | undefined,
  dataType: string,
  modelName: string,
  result: SmlConvertResultBuilder,
): string {
  if (colName) {
    if (
      !DbtTools.hasStringValue(expr) ||
      (DbtTools.hasStringValue(expr) && expr === colName)
    )
      return colName;
    const dataset = result.datasets.find(
      (ds) => ds.unique_name === DbtTools.dsName(modelName),
    );
    if (dataset) {
      return columnFromCalc(dataset, colName, expr, dataType);
    }
  }
  return "";
}

function columnFound(
  dataset: SMLDataset,
  colName: string,
  expr: string,
): boolean {
  const foundColumn = dataset.columns.find(
    (c) =>
      c.name.localeCompare(colName) === 0 &&
      "sql" in c &&
      c.sql &&
      c.sql.toString().replace(/\s+/g, "") === expr.replace(/\s+/g, ""),
  );
  if (foundColumn) return true;
  return false;
}

function createSecondary(
  d: DbtYamlDimension,
  ds: string,
  smlUniqueNameGenerator: SmlUniqueNameGenerator,
): SMLDimensionSecondaryAttribute {
  const unique_name =
    smlUniqueNameGenerator.getNewUniqueNameForSecondaryAttribute(d.name);
  const secondary: SMLDimensionSecondaryAttribute = {
    unique_name,
    label: unique_name,
    dataset: ds,
    name_column: d.name,
    key_columns: [d.name],
  };
  return secondary;
}

export function columnFromCalc(
  dataset: SMLDataset,
  colName: string,
  expr: string,
  dataType: string,
): string {
  if (columnFound(dataset, colName, expr)) return colName;

  // Create new calculated column
  for (let i = 1; i < 1000; i++) {
    if (!columnFound(dataset, "calc_col" + i.toString, expr)) {
      const newName = "calc_col" + i.toString;
      const newColumn: SMLDatasetColumnSimple = {
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

// Finds fact datasets which are ones that have a measure
function listFactDatasets(
  result: SmlConvertResultBuilder,
  dbtIndex: IDbtIndex,
): Set<string> {
  const dsSet = new Set<string>();
  for (const dbtSemanticModel of dbtIndex.properties.semantic_models) {
    if (dbtSemanticModel && dbtSemanticModel.measures) {
      const ds = datasetFromSM(dbtSemanticModel.model, result);
      if (ds && "unique_name" in ds) dsSet.add(ds.unique_name);
    }
  }
  return dsSet;
}

function metricRemoval(
  result: SmlConvertResultBuilder,
  removedMetrics: Set<string>,
  logger: Logger,
) {
  if (
    !result.measuresCalculated ||
    removedMetrics.size === 0 ||
    !result.measuresCalculated
  )
    return;
  const newRemovedMetrics = new Set<string>();
  const newMeasures: SMLMetricCalculated[] = [];
  const newReferences: SMLModelMetricsAndCalc[] = [];

  // First remove them from model references
  result.models[0].metrics.forEach((m) => {
    if (!removedMetrics.has(m.unique_name)) newReferences.push(m);
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
      logger.warn(
        `Removing calculated metric '${calc.unique_name}' because it uses a removed metric`,
      );
    } else {
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

function dbUpper(dbtIndex: IDbtIndex, dbType: DWType): boolean {
  if (dbType.localeCompare("snowflake") != 0) return false;
  if (
    "quoting" in dbtIndex.project &&
    dbtIndex.project.quoting &&
    typeof dbtIndex.project.quoting === "object"
  ) {
    if (
      "database" in dbtIndex.project.quoting &&
      typeof dbtIndex.project.quoting.database === "boolean"
    ) {
      return !dbtIndex.project.quoting.database;
    }
  }
  return true;
}

function schemaUpper(dbtIndex: IDbtIndex, dbType: DWType): boolean {
  if (dbType.localeCompare("snowflake") != 0) return false;
  if (
    "quoting" in dbtIndex.project &&
    dbtIndex.project.quoting &&
    typeof dbtIndex.project.quoting === "object"
  ) {
    if (
      "schema" in dbtIndex.project.quoting &&
      typeof dbtIndex.project.quoting.schema === "boolean"
    ) {
      return !dbtIndex.project.quoting.schema;
    }
  }
  return true;
}

function colsUpper(dbtIndex: IDbtIndex, dbType: DWType): boolean {
  if (dbType.localeCompare("snowflake") != 0) return false;
  if (
    "quoting" in dbtIndex.project &&
    dbtIndex.project.quoting &&
    typeof dbtIndex.project.quoting === "object"
  ) {
    if (
      "identifier" in dbtIndex.project.quoting &&
      typeof dbtIndex.project.quoting.identifier === "boolean"
    ) {
      return !dbtIndex.project.quoting.identifier;
    }
  }
  return true;
}

// If the query engine is Snowflake often the db/schema/tables/columns will be created upper case but are
// considered case insensitive when querying in Snowflake. However AtScale treats all identifies as case
// sensitive so we need to potentially upper case them
function applyCaseSensitivity(
  result: SmlConvertResultBuilder,
  identifiersNameUpper: boolean,
) {
  if (!identifiersNameUpper) return;
  result.datasets.forEach((ds) => {
    if (ds.table) ds.table = ds.table.toUpperCase();
    ds.columns.forEach((col) => {
      col.name = col.name.toLocaleUpperCase();
      if ("sql" in col && col.sql) {
        col.sql =
          typeof col.sql === "string" ? col.sql.toLocaleUpperCase() : undefined;
      }
    });
  });

  result.measures.forEach((m) => {
    m.column = m.column.toLocaleUpperCase();
  });

  result.dimensions.forEach((d) => {
    d.level_attributes.forEach((la) => {
      la.name_column = la.name_column.toLocaleUpperCase();
      if (la.sort_column) la.sort_column = la.sort_column.toLocaleUpperCase();
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

function createOthers(
  dimensions: DbtYamlDimension[] | undefined,
  datasetName: string,
  levelName: string,
  smlUniqueNameGenerator: SmlUniqueNameGenerator,
): SMLDimensionSecondaryAttribute[] | undefined {
  if (!dimensions) return undefined;
  const list: SMLDimensionSecondaryAttribute[] = [];
  // Create a secondary attribute for all but the level attribute
  dimensions
    .filter((d) => d.name.localeCompare(levelName) != 0)
    .forEach((d) =>
      list.push(createSecondary(d, datasetName, smlUniqueNameGenerator)),
    );
  return list;
}
