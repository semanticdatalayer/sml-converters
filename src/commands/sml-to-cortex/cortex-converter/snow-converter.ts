import { Logger } from "../../../shared/logger";

import {
  SmlConverterResult,
  SmlConvertResultBuilder,
} from "../../../shared/sml-convert-result";

import { 
  SMLReferenceableObjectWithLabel,
  SMLModel,
  SMLModelRelationship,
  SMLCompositeModel,
  SMLCatalog,
  SMLConnection,
  SMLDataset,
  SMLColumnDataType,
  SMLDimension,
  SMLDimensionLevel,
  SMLDimensionLevelAttribute,
  SMLDimensionMetric,
  SMLDimensionSecondaryAttribute,
  SMLEmbeddedRelationship,
  SMLLevelAliasAttribute,
  SMLCalculationMethod,
  SMLMetric,
  SMLMetricCalculated,
  SMLRowSecurity
 } from "sml-sdk";

import {  writeFile } from "fs";
import yaml from "js-yaml";
import { IYamlFile } from "../models/IYamlFile";
import { sortAlphabetically } from "./cortex-tools";

import { ISnowDimension, ISnowMeasure, ISnowModel, ISnowTable, ISnowTimeDimension } from "./snow-model";

// NOTES
// data_type: Measures always have type NUMBER, while dimensions can be NUMBER, TEXT, or TIMESTAMP

const DEBUG = true;
const MAP_MEASURES_TO_DIMS = true;

export async function Convert(
  smlObjects: SmlConverterResult,
  modelToConvert: SMLModel,
  logger: Logger,
  doMapDatasetsToDims: boolean
): Promise<ISnowModel> {
  // The deployed catalog has the branch appended. If the branch is main the deployed will be like: sml-tpcds_main
  // But we don't have the branch from the SML path.
  const snowModel = new ISnowModel(modelToConvert.unique_name);

  const smlModel = createSMLModel(smlObjects, modelToConvert.unique_name, logger);
  if (!smlModel) throw new Error(`No model found with unique_name '${modelToConvert.unique_name}' to convert`);

  const asCatalog = smlObjects.catalog.unique_name;
  const rolePlays = new Set<string>();
  const models: Array<SMLModel> = listUsedModels(smlModel, smlObjects);
  const modelObjects = filterSMLForModel(smlObjects, models, rolePlays);

  let mapDatasetsToDims = new Map<string, Set<string>>();
  if (doMapDatasetsToDims) mapDatasetsToDims = createMapDatasetsToDims(modelObjects, models);

  snowModel.description = `Snowflake semantic model generated from the SML model '${smlModel.unique_name}'`;
  snowModel.tables = new Array<ISnowTable>();
  const newTable = {
    name: smlModel.unique_name,
    description: `Logical table based on an SML semantic model`,
    baseTable: {
      database: asCatalog,
      schema: asCatalog,
      table: smlModel.unique_name,
    },
  } as ISnowTable;

  const attrUniqueNames = new Set<string>();

  addMeasures(modelObjects, newTable, mapDatasetsToDims, attrUniqueNames, logger);

  addCalculations(modelObjects, newTable, mapDatasetsToDims, attrUniqueNames, logger);

  addDimensions(smlObjects, modelObjects, newTable, rolePlays, mapDatasetsToDims, attrUniqueNames, logger);

  snowModel.tables.push(newTable);
  return snowModel;
}

function listTimeColumns(smlObjects: SmlConverterResult): Set<string> {
  const cols = new Set<string>();
  smlObjects.datasets.forEach((dataset) =>
    dataset.columns.forEach((column) => {
      if (
        "data_type" in column &&
        (column.data_type === SMLColumnDataType.DateTime ||
          column.data_type === SMLColumnDataType.TimeStamp ||
          column.data_type === SMLColumnDataType.Date)
      ) {
        cols.add(dataset.unique_name + "." + column.name);
      }
    })
  );
  return cols;
}

function listNumericColumns(smlObjects: SmlConverterResult): Set<string> {
  const cols = new Set<string>();
  smlObjects.datasets.forEach((dataset) =>
    dataset.columns.forEach((column) => {
      if (
        "data_type" in column &&
        (column.data_type === SMLColumnDataType.BigInt ||
          column.data_type === SMLColumnDataType.Int ||
          column.data_type === SMLColumnDataType.Decimal ||
          column.data_type === SMLColumnDataType.Double ||
          column.data_type === SMLColumnDataType.Float ||
          column.data_type === SMLColumnDataType.Long ||
          column.data_type === SMLColumnDataType.Number ||
          column.data_type === SMLColumnDataType.Numeric ||
          column.data_type === SMLColumnDataType.TinyInt)
      ) {
        cols.add(dataset.unique_name + "." + column.name);
      }
    })
  );
  return cols;
}

// Filters the SML objects for those used by the given model, and only includes dimensions and metrics.
// Role-play requires using the prefix in identifying relationships as well as potentially including
// multiple instances per attribute with the prefix applied
function filterSMLForModel(
  smlObjects: SmlConverterResult,
  models: Array<SMLModel>,
  rolePlays: Set<string>
): SmlConverterResult {
  let result = new SmlConvertResultBuilder();
  models.forEach((smlModel) => {
    smlObjects.measures.forEach((smlObject) => {
      if (
        smlModel.metrics.find((metric) => metric.unique_name === smlObject.unique_name) &&
        !result.measures.find((resultMeas) => resultMeas.unique_name === smlObject.unique_name)
      ) {
        result.addMeasures(smlObject);
      }
    });
    smlObjects.measuresCalculated.forEach((smlObject) => {
      if (
        smlModel.metrics.find((metric) => metric.unique_name === smlObject.unique_name) &&
        !result.measuresCalculated.find((resultCalc) => resultCalc.unique_name === smlObject.unique_name)
      ) {
        result.addMeasuresCalc(smlObject);
      }
    });
    // List all dimensions referenced by the model and their references recursively
    if (smlModel.relationships)
      smlModel.relationships.forEach((relationship) => {
        if ("dimension" in relationship.to) {
          const roleplay = "role_play" in relationship && relationship.role_play ? relationship.role_play : "";
          const dimRef = fmtDimRef(relationship, "");
          rolePlays.add(dimRef);
          addDimRels(
            smlObjects,
            smlObjects.dimensions.find((dim) => dim.unique_name === dimNameOnly(dimRef)),
            rolePlays,
            roleplay
          );
        }
      });
  });

  // List all degenerate dimensions to include
  const degenSet: Set<string> = new Set();
  models.forEach((model) => {
    if ("dimensions" in model) model.dimensions?.forEach((dim) => degenSet.add(dim));
  });

  // Now add all the referenced dimensions (separately for role-played) to the new result
  smlObjects.dimensions.forEach((dim) => {
    if (degenSet.has(dim.unique_name)) {
      result.addDimension(dim);
    } else if (Array.from(rolePlays).find((roleplay) => dimNameOnly(roleplay) === dim.unique_name)) {
      result.addDimension(dim);
      rolePlays.forEach((ref) => {
        if (ref.startsWith(dim.unique_name)) {
          // If role-played track instances
          if (ref.includes("|")) rolePlays.add(ref);
        }
      });
    }
  });

  return result;
}

function createMapDatasetsToDims(smlObjects: SmlConverterResult, models: Array<SMLModel>): Map<string, Set<string>> {
  const mapResult = new Map<string, Set<string>>();
  const usedDatasets = new Set<string>();
  const rolePlays = new Set<string>();

  models.forEach((smlModel) => {
    // List datasets used by measures in the model then iterate over them to build out the map
    smlObjects.measures.forEach((measure) => usedDatasets.add(measure.dataset));

    usedDatasets.forEach((dsName) => {
      rolePlays.clear();

      // List all dimensions referenced by the model and their references recursively
      if (smlModel.relationships) {
        smlModel.relationships.forEach((relationship) => {
          if ("dimension" in relationship.to && relationship.from.dataset === dsName) {
            const roleplay = "role_play" in relationship && relationship.role_play ? relationship.role_play : "";
            const dimRef = fmtDimRef(relationship, ""); // r.to.dimension;
            rolePlays.add(dimRef);
            addDimRels(smlObjects, dimFromName(smlObjects, dimRef), rolePlays, roleplay);
          }
        });
      }

      addReferencedDims(smlObjects, rolePlays);
      rolePlays.forEach((rolePlay) => addToMapWithSet(mapResult, dsName, listAttributesInDim(smlObjects, rolePlay)));
    });
  });

  return mapResult;
}

function addToMapWithSet(map: Map<string, Set<string>>, key: string, value: string | string[]) {
  let temp = new Set<string>();
  const val = map.get(key);
  if (val) temp = val;
  if (Array.isArray(value)) value.forEach((val2) => temp.add(val2));
  else temp.add(value);
  map.set(key, temp);
}

function fmtDimRef(relationship: SMLModelRelationship | SMLEmbeddedRelationship, roleplay: string): string {
  if ("dimension" in relationship.to) {
    if ("role_play" in relationship && relationship.role_play) {
      if (roleplay) {
        return `${relationship.to.dimension}|${roleplay.replace("{0}", relationship.role_play)}`;
      }
      return `${relationship.to.dimension}|${relationship.role_play}`;
    } else if (roleplay) {
      return `${relationship.to.dimension}|${roleplay}`;
    }
    return relationship.to.dimension;
  }
  throw new Error(`Missing 'dimension' property in TO of relationship from ${relationship.from.dataset}`); // Should never hit this
}

// Extracts the name of the dim from a reference
function dimNameOnly(reference: string): string {
  if (reference.includes("|")) return reference.substring(0, reference.indexOf("|"));
  return reference;
}

function addDimRels(
  smlObjects: SmlConverterResult,
  dim: SMLDimension | undefined,
  dimList: Set<string>,
  roleplay: string
) {
  if (dim?.relationships) {
    dim.relationships.forEach((relationship) => {
      if ("dimension" in relationship.to && relationship.type == "embedded") {
        const dimRef = fmtDimRef(relationship, roleplay); // r.to.dimension;
        dimList.add(dimRef);
        addDimRels(
          smlObjects,
          smlObjects.dimensions.find((dim) => dim.unique_name == dimNameOnly(dimRef)),
          dimList,
          roleplay
        );
      }
    });
  }
}

function mapToSnowMeasure(
  metric: SMLMetric | SMLMetricCalculated | SMLDimensionMetric,
  mapDatasetsToDims: Map<string, Set<string>>,
  unsupported_aggregation: Array<string>,
  attrUniqueNames: Set<string>,
  logger: Logger
): ISnowMeasure {
  const updatedUniqueName = ensureUnique(namingRules(metric.unique_name), attrUniqueNames, logger);
  const newMeas: ISnowMeasure = {
    name: updatedUniqueName,
    description: "description" in metric ? metric.description : undefined,
    synonyms: [metric.label],
    expr: `'"${metric.unique_name}"'`,
    data_type: "NUMBER",
  };
  let agg = "";
  if ("calculation_method" in metric) {
    agg = toCortexAggregation(metric.calculation_method);
    if (agg) {
      newMeas.default_aggregation = agg;
    } else {
      unsupported_aggregation.push(`${metric.label} (${metric.calculation_method})`);
    }
  }
  if (mapDatasetsToDims.size > 0 && "dataset" in metric) {
    const dimSet = mapDatasetsToDims.get(metric.dataset);
    if (dimSet) newMeas.allowed_dimensions = Array.from(dimSet);
  }
  return newMeas;
}

function addSnowDimsFromSmlDim(
  dim: SMLDimension,
  dimsAndColsToPass: PassDimsAndCols,
  snowMeasures: ISnowMeasure[],
  rolePlays: Set<string>,
  mapDatasetsToDims: Map<string, Set<string>>,
  attrUniqueNames: Set<string>,
  logger: Logger
) {
  const msgs = new Array<string>();

  if (dim.is_degenerate) {
    dim.level_attributes.forEach((attribute) =>
      addIfNotHidden(attribute, dimsAndColsToPass, "", msgs, attrUniqueNames, logger)
    );
    allLevels(dim).forEach((level) => {
      level.secondary_attributes?.forEach((secondary) =>
        addIfNotHidden(secondary, dimsAndColsToPass, "", msgs, attrUniqueNames, logger)
      );
    });
  } else {
    const roleplays = new Set<string>();
    rolePlays.forEach((roleplay) => {
      if (roleplay.startsWith(dim.unique_name))
        roleplays.add(roleplay.includes("|") ? roleplay.substring(roleplay.indexOf("|") + 1) : "{0}");
    });

    roleplays.forEach((roleplay) => {
      dim.level_attributes.forEach((attribute) =>
        addIfNotHidden(attribute, dimsAndColsToPass, roleplay, msgs, attrUniqueNames, logger)
      );
      allLevels(dim).forEach((level) => {
        level.secondary_attributes?.forEach((secondary) =>
          addIfNotHidden(secondary, dimsAndColsToPass, roleplay, msgs, attrUniqueNames, logger)
        );
        level.aliases?.forEach((alias) =>
          addIfNotHidden(alias, dimsAndColsToPass, roleplay, msgs, attrUniqueNames, logger)
        );
        level.metrics?.forEach((metric) =>
          snowMeasures.push(
            mapToSnowMeasure(
              metric,
              mapDatasetsToDims,
              dimsAndColsToPass.unsupported_aggregation,
              attrUniqueNames,
              logger
            )
          )
        );
      });
    });
  }
  if (msgs.length > 0) {
    if (logger)
      logger.info(
        `Attributes in dimension '${fmtForMsg(dim)}' found which are hidden so they will not be included in the conversion: ${sortAlphabetically(msgs, (n) => n).join(", ")}`
      );
  }
  if (dimsAndColsToPass.unsupported_aggregation.length > 0) {
    const sorted = sortAlphabetically(dimsAndColsToPass.unsupported_aggregation, (n) => n);
    logger.warn(
      `The following metrical attributes were found with an unsupported aggregation type so no 'default_aggregation' property will be defined: ${sorted.join(", ")}`
    );
  }
}

function addIfNotHidden(
  dimAttr: SMLDimensionLevelAttribute | SMLDimensionSecondaryAttribute,
  dimsAndColsToPass: PassDimsAndCols,
  role: string,
  msgs: Array<string>,
  attrUniqueNames: Set<string>,
  logger: Logger
) {
  if (role === "") role = "{0}";
  if (!dimAttr.is_hidden) {
    if ("dataset" in dimAttr && dimsAndColsToPass.timeColumns.has(`${dimAttr.dataset}.${dimAttr.name_column}`)) {
      dimsAndColsToPass.snowTimeDims.push(mapToSnowTimeDim(dimAttr, role, attrUniqueNames, logger));
    } else {
      dimsAndColsToPass.snowDims.push(
        mapToSnowDim(dimAttr, role, dimsAndColsToPass.numericColumns, attrUniqueNames, logger)
      );
    }
  } else {
    msgs.push(fmtForMsg(dimAttr));
  }
}

function fmtForMsg(obj: SMLReferenceableObjectWithLabel): string {
  return obj.label == obj.unique_name ? `${obj.label}` : `${obj.label} (${obj.unique_name})`;
}

function mapToSnowDim(
  attribute: SMLDimensionLevelAttribute | SMLDimensionSecondaryAttribute | SMLLevelAliasAttribute,
  roleplay: string,
  numericColumns: Set<string>,
  attrUniqueNames: Set<string>,
  logger: Logger
): ISnowDimension {
  const updatedUniqueName = ensureUnique(
    namingRules(roleplay.replace("{0}", attribute.unique_name)),
    attrUniqueNames,
    logger
  ); // role.replace("{0}", a.unique_name).replaceAll(" ", "_");
  return {
    name: updatedUniqueName,
    synonyms: [roleplay.replace("{0}", attribute.label)],
    description: attribute.description ? attribute.description : undefined,
    expr: `'"${roleplay.replace("{0}", attribute.unique_name)}"'`,
    data_type:
      "dataset" in attribute && numericColumns.has(`${attribute.dataset}.${attribute.name_column}`) ? "NUMBER" : "TEXT",
    unique: "is_unique_key" in attribute ? attribute.is_unique_key : false,
  } as ISnowDimension;
}

function mapToSnowTimeDim(
  attribute: SMLDimensionLevelAttribute | SMLDimensionSecondaryAttribute | SMLLevelAliasAttribute,
  role: string,
  attrUniqueNames: Set<string>,
  logger: Logger
): ISnowTimeDimension {
  const updatedUniqueName = ensureUnique(
    namingRules(role.replace("{0}", attribute.unique_name)),
    attrUniqueNames,
    logger
  ); // role.replace("{0}", a.unique_name).replaceAll(" ", "_");
  return {
    name: updatedUniqueName,
    synonyms: [role.replace("{0}", attribute.label)],
    description: attribute.description ? attribute.description : undefined,
    expr: `'"${role.replace("{0}", attribute.unique_name)}"'`,
    data_type: "TIMESTAMP",
    unique: "is_unique_key" in attribute ? attribute.is_unique_key : false,
  } as ISnowTimeDimension;
}

// function processValidation(validationResult: IRepoValidatorResult, logger: Logger): string {
//   let msgs = "";
//   let warns = "";
//   validationResult.filesOutput.forEach((validationMsg) =>
//     validationMsg.compilationOutput.forEach((compiled) => {
//       if (compiled.severity === "error") {
//         if (!DEBUG || compiled.message !== "must have required property 'relationships'") {
//           msgs += `\n   File '${validationMsg.relativePath}': ${compiled.message}`;
//         }
//       }
//       if (compiled.severity.includes("warn")) {
//         warns += `\n   File '${validationMsg.relativePath}': ${compiled.message}`;
//       }
//     })
//   );
//   if (msgs.length > 1) {
//     msgs = "The following validation errors were found in the incoming SML and must be addressed:" + msgs;
//   }
//   if (warns.length > 1) {
//     logger.warn("The following validation warnings were found in the incoming SML:" + warns);
//   }
//   return msgs;
// }

export function makeResultFromFileList(smlFiles: Array<IYamlFile>, logger: Logger): SmlConverterResult {
  const result = new SmlConvertResultBuilder;
  smlFiles.forEach((smlFile) => {
    switch (smlFile.type) {
      case "catalog":
        result.catalog = smlFile.data as SMLCatalog;
        break;
      case "model":
        result.addModel(smlFile.data as SMLModel);
        break;
      case "dataset":
        result.addDatasets(smlFile.data as SMLDataset);
        break;
      case "dimension":
        result.addDimension(smlFile.data as SMLDimension);
        break;
      case "metric":
        result.addMeasures(smlFile.data as SMLMetric);
        break;
      case "metric_calc":
        result.addMeasuresCalc(smlFile.data as SMLMetricCalculated);
        break;
      case "connection":
        result.addConnection(smlFile.data as SMLConnection);
        break;
      case "row_security":
        result.addRowSecurity(smlFile.data as SMLRowSecurity);
        break;
      case "composite_model":
        result.addCompositeModel(smlFile.data as SMLCompositeModel);
        break;
      default:
        logger.warn(`Object type of ${smlFile.type} not recognized so object will be skipped`);
        break;
    }
  });
  return result;
}

// export function makeFileListFromResult(smlResult: IConverterResult, logger: Logger): IYamlParsedFile<IYamlObject>[] {
//   // const filesOutput = new Array<IYamlParsedFile<IYamlObject>>;
//   const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [smlResult.catalog, smlResult.models[0]];

//   filesOutput.push();
//   smlResult.catalog;

//   smlFiles.forEach((smlFile) => {
//     switch (smlFile.type) {
//       case "catalog":
//         result.catalog = smlFile.data as IYamlCatalog;
//         break;
//       case "model":
//         result.addModel(smlFile.data as IYamlModel);
//         break;
//       case "dataset":
//         result.addDatasets(smlFile.data as IYamlDataset);
//         break;
//       case "dimension":
//         result.addDimension(smlFile.data as IYamlDimension);
//         break;
//       case "metric":
//         result.addMeasures(smlFile.data as IYamlMeasure);
//         break;
//       case "metric_calc":
//         result.addMeasuresCalc(smlFile.data as IYamlMeasureCalculated);
//         break;
//       case "connection":
//         result.addConnection(smlFile.data as IYamlConnection);
//         break;
//       case "row_security":
//         result.addRowSecurity(smlFile.data as IYamlRowSecurity);
//         break;
//       case "composite_model":
//         result.addCompositeModel(smlFile.data as IYamlCompositeModel);
//         break;
//       default:
//         logger.warn(`Object type of ${smlFile.type} not recognized so object will be skipped`);
//         break;
//     }
//   });
//   return result;
// }

export function writeYamlToFile(snowModel: ISnowModel, exportFile: string, logger: Logger) {
  // The expr property needs to be formatted with both single and double quotes but the marshaller
  // wraps it in 2 single quotes. This replaceAll corrects that
  const yamlString = yaml.dump(snowModel).replaceAll("'''", "'");

  try {
    writeFile(exportFile, yamlString, (err) => {
      if (err) {
        logger.error("Error writing file:" + err?.message);
        throw err;
      }
    });
    logger.info("YAML file has been saved successfully to: " + exportFile);
  } catch (error) {
    logger.error(`Error writing yaml to file: ${error}`);
  }
}

function listUsedModels(smlModel: SMLModel | SMLCompositeModel, smlObjects: SmlConverterResult): Array<SMLModel> {
  const models = new Array<SMLModel>(); // To support composite models
  if ("models" in smlModel) {
    smlModel.models.forEach((model) => {
      const foundModel = smlObjects.models.find((findModel) => findModel.unique_name === model);
      if (foundModel) models.push(foundModel);
    });
  } else {
    models.push(smlModel);
  }
  return models;
}

function listAttributesInDim(smlObjects: SmlConverterResult, rolePlay: string): string[] {
  const attributes: string[] = [];
  const rpAry = rolePlay.split("|");
  let roleplay = "";
  if (rpAry.length == 2) roleplay = rpAry[1];
  if (rpAry.length == 0 || rpAry.length > 2) {
    throw new Error(`Invalid format found for dimension reference with rolePlay: '${rolePlay}'`);
  }
  const dim = smlObjects.dimensions.find((findDim) =>
    rolePlay.toLowerCase().startsWith(findDim.unique_name.toLowerCase())
  );
  if (dim) {
    dim.level_attributes.forEach((levelAttr) =>
      attributes.push(roleplay ? roleplay.replace("{0}", levelAttr.unique_name) : levelAttr.unique_name)
    );
    allLevels(dim).forEach((level) => {
      level.secondary_attributes?.forEach((secondary) =>
        attributes.push(roleplay ? roleplay.replace("{0}", secondary.unique_name) : secondary.unique_name)
      );
      level.aliases?.forEach((alias) =>
        attributes.push(roleplay ? roleplay.replace("{0}", alias.unique_name) : alias.unique_name)
      );
      level.metrics?.forEach((metric) =>
        attributes.push(roleplay ? roleplay.replace("{0}", metric.unique_name) : metric.unique_name)
      );
    });
  }
  return attributes;
}

type modelType = SMLModel | SMLCompositeModel | undefined;

function createSMLModel(smlObjects: SmlConverterResult, modelToConvert: string, logger: Logger): modelType {
  let smlModel: modelType = smlObjects.models.find((model) => model.unique_name === modelToConvert);
  if (!smlModel) {
    smlModel = smlObjects.compositeModels.find((compositeModel) => compositeModel.unique_name == modelToConvert);
    if (!smlModel) {
      smlModel = getDefaultModel(smlObjects, modelToConvert, DEBUG, logger);
    }
  }
  if (!smlModel) {
    throw new Error(`No model with unique_name '${modelToConvert}' found in catalog`);
  }
  return smlModel;
}

function dimFromName(smlObjects: SmlConverterResult, dimRef: string): SMLDimension | undefined {
  return smlObjects.dimensions.find((dim) => dim.unique_name === dimNameOnly(dimRef));
}

// Adds all the referenced dimensions (separately for role-played) to the new result
function addReferencedDims(smlObjects: SmlConverterResult, rolePlays: Set<string>) {
  smlObjects.dimensions.forEach((dim) => {
    if (Array.from(rolePlays).find((roleplay) => dimNameOnly(roleplay) === dim.unique_name)) {
      rolePlays.forEach((ref) => {
        if (ref.startsWith(dim.unique_name)) {
          // If role-played track instances
          if (ref.includes("|")) rolePlays.add(ref);
        }
      });
    }
  });
}

interface PassDimsAndCols {
  timeColumns: Set<string>;
  numericColumns: Set<string>;
  snowDims: Array<ISnowDimension>;
  snowTimeDims: Array<ISnowTimeDimension>;
  unsupported_aggregation: Array<string>;
}

function addDimensions(
  smlObjects: SmlConverterResult,
  modelObjects: SmlConverterResult,
  newTable: ISnowTable,
  rolePlays: Set<string>,
  mapDatasetsToDims: Map<string, Set<string>>,
  attrUniqueNames: Set<string>,
  logger: Logger
) {
  const dimsAndColsToPass: PassDimsAndCols = {
    timeColumns: listTimeColumns(smlObjects),
    numericColumns: listNumericColumns(smlObjects),
    snowDims: new Array<ISnowDimension>(),
    snowTimeDims: new Array<ISnowTimeDimension>(),
    unsupported_aggregation: new Array<string>(),
  };
  modelObjects.dimensions.forEach((dim) => {
    addSnowDimsFromSmlDim(
      dim,
      dimsAndColsToPass,
      newTable.measures,
      rolePlays,
      mapDatasetsToDims,
      attrUniqueNames,
      logger
    );
  });
  if (dimsAndColsToPass.snowDims.length > 0) newTable.dimensions = dimsAndColsToPass.snowDims;
  if (dimsAndColsToPass.snowTimeDims.length > 0) newTable.time_dimensions = dimsAndColsToPass.snowTimeDims;
}

function allLevels(dim: SMLDimension): SMLDimensionLevel[] {
  const levels: SMLDimensionLevel[] = [];
  dim.hierarchies.forEach((hier) => {
    hier.levels.forEach((level) => levels.push(level));
  });
  return levels;
}

function getDefaultModel(
  smlObjects: SmlConverterResult,
  modelToConvert: string,
  DEBUG: boolean,
  logger: Logger
): modelType {
  let smlModel: SMLModel;
  if (DEBUG) {
    smlModel = smlObjects.models[0];
    if (logger && modelToConvert) {
      logger.info(
        `Model with name '${modelToConvert}' not found in catalog, so converting first model, '${smlModel.unique_name}'`
      );
    } else {
      throw new Error(`No model with unique_name '${modelToConvert}' found in catalog`);
    }
  } else if (smlObjects.models.length == 1) {
    smlModel = smlObjects.models[0];
    if (logger && modelToConvert) {
      logger.warn(
        `Model with name '${modelToConvert}' not found in catalog, however only 1 model exists, '${smlModel.unique_name}', so it will be converted`
      );
    }
  } else {
    throw new Error(`No model with unique_name '${modelToConvert}' found in catalog`);
  }
  return smlModel;
}

function addCalculations(
  modelObjects: SmlConverterResult,
  newTable: ISnowTable,
  mapDatasetsToDims: Map<string, Set<string>>,
  attrUniqueNames: Set<string>,
  logger: Logger
) {
  const calcMsgs = new Array<string>();
  modelObjects.measuresCalculated.forEach((calc) => {
    if (!("is_hidden" in calc) || !calc.is_hidden) {
      if (!newTable.measures) newTable.measures = [];
      // There's no default_aggregation in calculations so no messages are tracked for them
      newTable.measures.push(mapToSnowMeasure(calc, mapDatasetsToDims, new Array<string>(), attrUniqueNames, logger));
    } else {
      calcMsgs.push(fmtForMsg(calc));
    }
  });
  if (calcMsgs.length > 0) {
    if (logger)
      logger.info(
        `Calculations found which are hidden so they will not be included in the conversion: ${sortAlphabetically(calcMsgs, (n) => n).join(", ")}`
      );
  }
}

function addMeasures(
  modelObjects: SmlConverterResult,
  newTable: ISnowTable,
  mapDatasetsToDims: Map<string, Set<string>>,
  attrUniqueNames: Set<string>,
  logger: Logger
) {
  const measMsgs = new Array<string>();
  let unsupported_aggregation = new Array<string>();

  modelObjects.measures.forEach((measure) => {
    if (!measure.is_hidden) {
      if (!newTable.measures) newTable.measures = [];
      newTable.measures.push(
        mapToSnowMeasure(measure, mapDatasetsToDims, unsupported_aggregation, attrUniqueNames, logger)
      );
    } else {
      measMsgs.push(fmtForMsg(measure));
    }
  });
  if (measMsgs.length > 0) {
    if (logger)
      logger.info(
        `Measures found which are hidden so they will not be included in the conversion: ${sortAlphabetically(measMsgs, (n) => n).join(", ")}`
      );
  }
  if (unsupported_aggregation.length > 0) {
    unsupported_aggregation = unsupported_aggregation.sort((a, b) => a.localeCompare(b));
    logger.warn(
      `The following measures were found with an unsupported aggregation type so no 'default_aggregation' property will be defined: ${unsupported_aggregation.join(", ")}`
    );
  }
}

function toCortexAggregation(smlCalcMethod: SMLCalculationMethod): string {
  switch (smlCalcMethod) {
    case "sum":
      return smlCalcMethod;
    case "average":
      return "avg";
    case "minimum":
      return "min";
    case "maximum":
      return "max";
    case "count distinct":
      return "count_distinct";
    default: // Not supported by Cortex Analyst. Example is "count non-null"
      return "";
  }
}

function namingRules(str: string) {
  if (!str) return str;
  const originalStr = str;
  // Replace spaces with underscores
  str = str.replace(/\s+/g, "_");
  // Remove all characters that are not letters, underscores, digits, or dollar signs
  str = str.replace(/[^a-zA-Z0-9_$]/g, "_");
  str = str.toUpperCase();
  // Replace consecutive underscores with a single underscore
  str = str.replace(/_+/g, "_");
  // Remove initial underscore unless original string started with an underscore
  if (!originalStr.startsWith("_")) {
    str = str.replace(/^_/, ""); // Remove the leading underscore if the original didn't start with one
  }
  // Remove trailing underscores
  str = str.replace(/_+$/, "");
  return str;
}

function ensureUnique(input: string, attrUniqueNames: Set<string>, logger: Logger): string {
  if (!attrUniqueNames.has(input)) {
    attrUniqueNames.add(input);
    return input;
  }
  let i = 1;
  let newString = input;
  while (attrUniqueNames.has(newString)) {
    newString = `${input}_${i}`;
    i++;
  }
  logger.warn(`Multiple instances of name '${input}' found so one instance is being changed to '${newString}'`); // TODO: Put this back
  attrUniqueNames.add(newString);
  return newString;
}
