import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SMLModel } from "sml-sdk";
import { CortexModel, CortexTable } from "../cortex-models/CortexModel";
import { createMapDatasetsToDims } from "./cortex-analysis";
import { addCalculations, addDimensions, addMeasures } from "./cortex-builder";
import {
  getSMLModel,
  filterSMLForModel,
  listUsedModels,
} from "./cortex-sml-processor";

export function convertSmlModelToCortexModel(
  smlObjects: SmlConverterResult,
  modelToConvert: SMLModel,
  logger: Logger,
  mapDatasetsToDims: boolean,
): CortexModel {
  const cortexModel = new CortexModel(modelToConvert.unique_name);

  const smlModel = getSMLModel(smlObjects, modelToConvert.unique_name, logger);
  if (!smlModel)
    throw new Error(
      `No model found with unique_name '${modelToConvert.unique_name}' to convert`,
    );

  const asCatalog = smlObjects.catalog.unique_name;
  const rolePlays = new Set<string>();
  const models: Array<SMLModel> = listUsedModels(smlModel, smlObjects);
  const modelObjects = filterSMLForModel(smlObjects, models, rolePlays);

  let datasetsToDimsMap = new Map<string, Set<string>>();
  if (mapDatasetsToDims)
    datasetsToDimsMap = createMapDatasetsToDims(modelObjects, models);

  cortexModel.description = `Snowflake semantic model generated from the SML model '${smlModel.unique_name}'`;
  cortexModel.tables = new Array<CortexTable>();
  const newTable = {
    name: smlModel.unique_name,
    description: `Logical table based on an SML semantic model`,
    baseTable: {
      database: asCatalog,
      schema: asCatalog,
      table: smlModel.unique_name,
    },
  } as CortexTable;

  const attrUniqueNames = new Set<string>();

  addMeasures(
    modelObjects,
    newTable,
    datasetsToDimsMap,
    attrUniqueNames,
    logger,
  );

  addCalculations(
    modelObjects,
    newTable,
    datasetsToDimsMap,
    attrUniqueNames,
    logger,
  );

  addDimensions(
    smlObjects,
    modelObjects,
    newTable,
    rolePlays,
    datasetsToDimsMap,
    attrUniqueNames,
    logger,
  );

  cortexModel.tables.push(newTable);
  return cortexModel;
}
