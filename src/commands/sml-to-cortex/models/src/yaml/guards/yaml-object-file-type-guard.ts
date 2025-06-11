import { IYamlFile } from "../../IYamlFile";
import { IYamlCatalog } from "../IYamlCatalog";
import { IYamlCompositeModel } from "../IYamlCompositeModel";
import { IYamlConnection } from "../IYamlConnection";
import { IYamlDataset } from "../IYamlDataset";
import { IYamlDimension } from "../IYamlDimension";
import { IYamlGlobalSettings } from "../IYamlGlobalSettings";
import { IYamlMeasure } from "../IYamlMeasure";
import { IYamlModel } from "../IYamlModel";
import { IYamlObject } from "../IYamlObject";
import { IYamlMeasureCalculated } from "./../IYamlMeasure";
import YamlObjectTypeGuard from "./yaml-object-type-guard";

const isYamlFileOfType = <T extends IYamlObject>(input: IYamlFile, typeGuard: (input: IYamlObject) => input is T) => {
  return typeGuard(input.data);
};

const YamlObjectFileTypeGuard = {
  isConnectionFile(input: IYamlFile): input is IYamlFile<IYamlConnection> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isConnection);
  },
  isDatasetFile(input: IYamlFile): input is IYamlFile<IYamlDataset> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isDataset);
  },
  isDimensionFile(input: IYamlFile): input is IYamlFile<IYamlDimension> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isDimension);
  },
  isMeasureFile(input: IYamlFile): input is IYamlFile<IYamlMeasure> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isMeasure);
  },
  isModelFile(input: IYamlFile): input is IYamlFile<IYamlModel> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isModel);
  },
  isCompositeModelFile(input: IYamlFile): input is IYamlFile<IYamlCompositeModel> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isCompositeModel);
  },
  isMeasureCalcFile(input: IYamlFile): input is IYamlFile<IYamlMeasureCalculated> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isMeasureCalc);
  },
  isCatalogFile(input: IYamlFile): input is IYamlFile<IYamlCatalog> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isCatalog);
  },
  isGlobalSettingsFile(input: IYamlFile): input is IYamlFile<IYamlGlobalSettings> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isGlobalSettings);
  },
};

export default YamlObjectFileTypeGuard;
