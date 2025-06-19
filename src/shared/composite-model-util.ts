// Taken out of validator package from sml-cli
// TODO: if validator package gets moved to SDK, remove this file

import {
    SMLObjectType,
    SMLCompositeModel,
    SMLModel,
    SMLModelOverride,
    SMLObject
} from 'sml-sdk'

import SmlObjectTypeGuard from "../commands/sml-to-cortex/cortex-models/yaml/guards/SmlObjectTypeGuard";

/**
 * Converts a composite model to a regular model if the original file is composite model.
 * @param file Original SMLObject that should be a SMLCompositeModel.
 * @param allFiles An array of all SML Objects in the repository.
 * @returns A new regular model if the original file is composite model, otherwise returns the original file.
 */
export function convertCompositeModel(file: SMLCompositeModel, allFiles: Array<SMLModel>) {
  return SmlObjectTypeGuard.isCompositeModel(file)
    ? {
        ...file,
        data: generateCompositeModelData(file, allFiles),
      }
    : file;
}

/**
 * Generates a regular model from a composite model by merging its attributes
 * with those of its inner models.
 *
 * @param compositeModel - The composite model to be converted.
 * @param smlObjects - An array of all SML Models
 * @returns A new regular model with combined attributes.
 */
export function generateCompositeModelData(
  compositeModel: SMLCompositeModel, 
  smlObjects: Array<SMLModel>
): SMLModel {
  const smlModel: SMLModel = {
    relationships: [],
    metrics: compositeModel.metrics ?? [],
    object_type: SMLObjectType.Model,
    label: compositeModel.label,
    unique_name: compositeModel.unique_name,
    dimensions: [],
  };

  // Merge attributes from each inner model into the new model
  compositeModel.models.forEach((innerModelName) => {
    const innerModel = smlObjects.find((file) => file.unique_name === innerModelName);

    if (!innerModel) {
      throw new Error(`No object found with unique name ${innerModelName}`);
    }

    const innerModelData = innerModel as SMLModel;

    smlModel.metrics = smlModel.metrics.concat(innerModelData.metrics);
    smlModel.dimensions = smlModel.dimensions?.concat(innerModelData.dimensions ?? []);
    smlModel.relationships = smlModel.relationships.concat(innerModelData.relationships);
    smlModel.overrides = mergeOverrides(smlModel, innerModelData);
  });

  // Clean up any empty properties
  if (!smlModel.dimensions?.length) {
    smlModel.dimensions = undefined;
  }

  if (!smlModel.overrides || !Object.values(smlModel.overrides).length) {
    smlModel.overrides = undefined;
  }

  return smlModel;
}

function mergeOverrides(model1: SMLModel, model2: SMLModel): SMLModelOverride {
  return {
    ...model1.overrides,
    ...model2.overrides,
  };
}
