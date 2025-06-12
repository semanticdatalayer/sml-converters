import IYamlParsedFile from "../../IYamlParsedFile";
import YamlObjectTypeGuard from "../guards/yaml-object-type-guard";

import {
  SMLCompositeModel,
  SMLDimension,
  SMLModel,
  SMLObject
} from 'sml-sdk'

// import { IYamlCompositeModel as SMLCompositeModel } from "../IYamlCompositeModel";
// import { IYamlDimension as SMLDimension } from "../IYamlDimension";
// import { IYamlModel as SMLModel } from "../IYamlModel";
// import { IYamlObject as SMLObject } from "../IYamlObject";

export const getAllModels = (
  yamlParsedFiles: IYamlParsedFile<SMLObject>[]
): IYamlParsedFile<SMLModel | SMLCompositeModel>[] => {
  return yamlParsedFiles.filter(
    (currentFile) =>
      YamlObjectTypeGuard.isModel(currentFile.data) || YamlObjectTypeGuard.isCompositeModel(currentFile.data)
  ) as IYamlParsedFile<SMLModel | SMLCompositeModel>[];
};

export const getAllDimensions = (
  yamlParsedFiles: IYamlParsedFile<SMLObject>[]
): IYamlParsedFile<SMLDimension>[] => {
  return yamlParsedFiles.filter((currentFile) =>
    YamlObjectTypeGuard.isDimension(currentFile.data)
  ) as IYamlParsedFile<SMLDimension>[];
};

export const getAllParsedItems = (yamlParsedFiles: IYamlParsedFile<SMLObject>[]) => {
  return yamlParsedFiles.reduce((map, file) => {
    map.set(file.data.unique_name, file);
    return map;
  }, new Map<string, IYamlParsedFile>());
};
