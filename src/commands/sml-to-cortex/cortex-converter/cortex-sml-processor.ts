import { 
    SMLCompositeModel, 
    SMLDimension, 
    SMLDimensionLevel, 
    SMLModel, 
    SMLObjectTypeGuard } from "sml-sdk";
import { SmlConverterResult, SmlConvertResultBuilder } from "../../../shared/sml-convert-result";
import { dimNameOnly, replacePlaceholder, fmtDimRef, isRegularRelationship } from "./cortex-tools";
import Guard from "../../../shared/guard";
import { Logger } from "../../../shared/logger";

/**
 * Filters the SML objects for those used by the given model, and only includes dimensions and metrics.
 * Role-play requires using the prefix in identifying relationships as well as potentially including
 * multiple instances per attribute with the prefix applied
 */
export function filterSMLForModel(
  smlObjects: SmlConverterResult,
  models: Array<SMLModel>,
  rolePlays: Set<string>): SmlConverterResult {
  let result = new SmlConvertResultBuilder();
  models.forEach((smlModel) => {
    smlObjects.measures.forEach((smlObject) => {
      if (smlModel.metrics.find((metric) => metric.unique_name === smlObject.unique_name) &&
        !result.measures.find((resultMeas) => resultMeas.unique_name === smlObject.unique_name)) {
        result.addMeasures(smlObject);
      }
    });
    smlObjects.measuresCalculated.forEach((smlObject) => {
      if (smlModel.metrics.find((metric) => metric.unique_name === smlObject.unique_name) &&
        !result.measuresCalculated.find((resultCalc) => resultCalc.unique_name === smlObject.unique_name)) {
        result.addMeasuresCalc(smlObject);
      }
    });
    // List all dimensions referenced by the model and their references recursively
    if (smlModel.relationships)
      smlModel.relationships.forEach((relationship) => {
        if (isRegularRelationship(relationship)) {
          const roleplay = relationship.role_play || "";
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
    (model.dimensions ?? []).forEach((dim) => degenSet.add(dim));
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

export function listUsedModels(smlModel: SMLModel | SMLCompositeModel, smlObjects: SmlConverterResult): Array<SMLModel> {
  const models = new Array<SMLModel>(); // To support composite models
  if (SMLObjectTypeGuard.isCompositeModel(smlModel)) {
    smlModel.models.forEach((model) => {
      const foundModel = Guard.ensure(smlObjects.models.find((findModel) => findModel.unique_name === model),
        `Cannot find referenced model ${model} form complex model ${smlModel.unique_name}. Consider running validation`);
      models.push(foundModel);
    });
  } else {
    models.push(smlModel);
  }
  return models;
}

export type modelType = SMLModel | SMLCompositeModel | undefined;

export function getSMLModel(smlObjects: SmlConverterResult, modelToConvert: string, logger: Logger): modelType {
  let smlModel: modelType = smlObjects.models.find((model) => model.unique_name === modelToConvert);
  if (!smlModel) {
    smlModel = smlObjects.compositeModels.find((compositeModel) => compositeModel.unique_name == modelToConvert);
    if (!smlModel) {
      // if no model found with modelToConvert name
      smlModel = getDefaultModel(smlObjects, modelToConvert, logger);
    }
  }
  return smlModel;
}

function getDefaultModel(
  smlObjects: SmlConverterResult,
  modelToConvert: string,
  logger: Logger
): modelType {
  let smlModel: SMLModel;
  if (smlObjects.models.length == 1) {
    smlModel = smlObjects.models[0];
    logger.warn(
      `Model with name '${modelToConvert}' not found in catalog, however only 1 model exists, '${smlModel.unique_name}', so it will be converted`
    );
  } else if (smlObjects.models.length > 1) {
    smlModel = smlObjects.models[0];
    logger.info(
      `Model with name '${modelToConvert}' not found in catalog, so converting first model, '${smlModel.unique_name}'`
    );
  } else {
    // smlObjects.models has length of 0
    throw new Error(`Catalog does not contain a model`);
  }
  return smlModel;
}

export function addDimRels(
  smlObjects: SmlConverterResult,
  dim: SMLDimension | undefined,
  dimList: Set<string>,
  roleplay: string
) {
  if (dim) {
    (dim.relationships ?? []).forEach((relationship) => {
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

// Adds all the referenced dimensions (separately for role-played) to the new result
export function addReferencedDims(smlObjects: SmlConverterResult, rolePlays: Set<string>) {
  const roleplayArr = Array.from(rolePlays);
  smlObjects.dimensions.forEach((dim) => {
    if (roleplayArr.find((roleplay) => dimNameOnly(roleplay) === dim.unique_name)) {
      rolePlays.forEach((ref) => {
        if (ref.startsWith(dim.unique_name)) {
          // If role-played track instances
          if (ref.includes("|")) rolePlays.add(ref);
        }
      });
    }
  });
}

export function listAttributesInDim(smlObjects: SmlConverterResult, rolePlay: string): string[] {
  const attributes: string[] = [];
  const rpAry = rolePlay.split("|");
  let roleplay = "";
  if (rpAry.length == 2) roleplay = rpAry[1];
  if (rpAry.length == 0 || rpAry.length > 2) {
    throw new Error(`Invalid format found for dimension reference with rolePlay: '${rolePlay}'`);
  }
  const dim = smlObjects.dimensions.find((findDim) => rolePlay.toLowerCase().startsWith(findDim.unique_name.toLowerCase())
  );
  if (dim) {
    dim.level_attributes.forEach((levelAttr) => attributes.push(roleplay ? replacePlaceholder(roleplay, levelAttr.unique_name) : levelAttr.unique_name)
    );
    getAllLevels(dim).forEach((level) => {
      level.secondary_attributes?.forEach((secondary) => attributes.push(roleplay ? replacePlaceholder(roleplay, secondary.unique_name) : secondary.unique_name)
      );
      level.aliases?.forEach((alias) => attributes.push(roleplay ? replacePlaceholder(roleplay, alias.unique_name) : alias.unique_name)
      );
      level.metrics?.forEach((metric) => attributes.push(roleplay ? replacePlaceholder(roleplay, metric.unique_name) : metric.unique_name)
      );
    });
  }
  return attributes;
}

export function dimFromName(smlObjects: SmlConverterResult, dimRef: string): SMLDimension | undefined {
  return smlObjects.dimensions.find((dim) => dim.unique_name === dimNameOnly(dimRef));
}

export function getAllLevels(dim: SMLDimension): SMLDimensionLevel[] {
  return dim.hierarchies.flatMap(hier => hier.levels);
}
