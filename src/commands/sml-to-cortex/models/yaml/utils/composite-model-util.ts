import {
    SMLObjectType,
    SMLCompositeModel,
    SMLModel,
    SMLModelOverride,
    SMLObject
} from 'sml-sdk'

import IYamlParsedFile from "../../IYamlParsedFile";
import YamlObjectTypeGuard from "../../yaml/guards/yaml-object-type-guard";

/**
 * Converts composite models into regular models by merging their attributes
 * with the attributes of their inner models. The composite models are removed
 * from the list and replaced with the new regular models. The function returns
 * the updated list of files.
 *
 * @param allFiles - An array of all YAML files in the repository.
 * @returns A new array of YAML files with converted models.
 */
export function convertCompositeModels(allFiles: IYamlParsedFile<SMLObject>[]): IYamlParsedFile<SMLObject>[] {
  return allFiles.map((file) => {
    return convertCompositeModel(file, allFiles);
  });
}

/**
 * Converts a composite model to a regular model, if the original file is composite model.
 * @param file Original yaml file.
 * @param allFiles An array of all YAML files in the repository.
 * @returns A new regular model if the original file is composite model, otherwise returns the original file.
 */
export function convertCompositeModel(file: IYamlParsedFile<SMLObject>, allFiles: IYamlParsedFile<SMLObject>[]) {
  return YamlObjectTypeGuard.isCompositeModel(file.data)
    ? {
        ...file,
        data: generateCompositeModelData(file as IYamlParsedFile<SMLCompositeModel>, allFiles),
      }
    : file;
}

/**
 * Generates a regular model from a composite model by merging its attributes
 * with those of its inner models.
 *
 * @param compositeModel - The composite model to be converted.
 * @param yamlFiles - An array of all YAML files in the repository.
 * @returns A new regular model with combined attributes.
 */
export function generateCompositeModelData(
  compositeModel: IYamlParsedFile<SMLCompositeModel>,
  yamlFiles: IYamlParsedFile<SMLObject>[]
): SMLModel {
  const yamlModel: SMLModel = {
    relationships: [],
    metrics: compositeModel.data.metrics ?? [],
    object_type: SMLObjectType.Model,
    label: compositeModel.data.label,
    unique_name: compositeModel.data.unique_name,
    dimensions: [],
  };

  // Merge attributes from each inner model into the new model
  compositeModel.data.models.forEach((innerModelName) => {
    const innerModel = yamlFiles.find((file) => file.data.unique_name === innerModelName);

    if (!innerModel) {
      throw new Error(`No object found with unique name ${innerModelName}`);
    }

    const innerModelData = innerModel.data as SMLModel;

    yamlModel.metrics = yamlModel.metrics.concat(innerModelData.metrics);
    yamlModel.dimensions = yamlModel.dimensions?.concat(innerModelData.dimensions ?? []);
    yamlModel.relationships = yamlModel.relationships.concat(innerModelData.relationships);
    yamlModel.overrides = mergeOverrides(yamlModel, innerModelData);
  });

  // Clean up any empty properties
  if (!yamlModel.dimensions?.length) {
    yamlModel.dimensions = undefined;
  }

  if (!yamlModel.overrides || !Object.values(yamlModel.overrides).length) {
    yamlModel.overrides = undefined;
  }

  return yamlModel;
}

function mergeOverrides(model1: SMLModel, model2: SMLModel): SMLModelOverride {
  return {
    ...model1.overrides,
    ...model2.overrides,
  };
}
