import IYamlParsedFile from "../../IYamlParsedFile";
import YamlObjectTypeGuard from "../guards/yaml-object-type-guard";
import { IYamlCompositeModel } from "../IYamlCompositeModel";
import { IYamlDimension } from "../IYamlDimension";
import { IYamlModel } from "../IYamlModel";
import { IYamlObject } from "../IYamlObject";

export const getAllModels = (
  yamlParsedFiles: IYamlParsedFile<IYamlObject>[]
): IYamlParsedFile<IYamlModel | IYamlCompositeModel>[] => {
  return yamlParsedFiles.filter(
    (currentFile) =>
      YamlObjectTypeGuard.isModel(currentFile.data) || YamlObjectTypeGuard.isCompositeModel(currentFile.data)
  ) as IYamlParsedFile<IYamlModel | IYamlCompositeModel>[];
};

export const getAllDimensions = (
  yamlParsedFiles: IYamlParsedFile<IYamlObject>[]
): IYamlParsedFile<IYamlDimension>[] => {
  return yamlParsedFiles.filter((currentFile) =>
    YamlObjectTypeGuard.isDimension(currentFile.data)
  ) as IYamlParsedFile<IYamlDimension>[];
};

export const getAllParsedItems = (yamlParsedFiles: IYamlParsedFile<IYamlObject>[]) => {
  return yamlParsedFiles.reduce((map, file) => {
    map.set(file.data.unique_name, file);
    return map;
  }, new Map<string, IYamlParsedFile>());
};
