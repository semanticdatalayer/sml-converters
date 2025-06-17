import { IYamlFile } from "../../IYamlFile";

import {
  SMLCatalog,
  SMLCompositeModel,
  SMLConnection,
  SMLDataset,
  SMLDimension,
  SMLGlobalSettings,
  SMLMetric,
  SMLMetricCalculated,
  SMLObject,
  SMLTypedObject,
  SMLModel
} from 'sml-sdk'

import YamlObjectTypeGuard from "./yaml-object-type-guard";

const isYamlFileOfType = <T extends SMLObject>(input: IYamlFile, typeGuard: (input: SMLObject) => input is T) => {
  return typeGuard(input.data);
};

const YamlObjectFileTypeGuard = {
  isConnectionFile(input: IYamlFile): input is IYamlFile<SMLConnection> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isConnection);
  },
  isDatasetFile(input: IYamlFile): input is IYamlFile<SMLDataset> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isDataset);
  },
  isDimensionFile(input: IYamlFile): input is IYamlFile<SMLDimension> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isDimension);
  },
  isMeasureFile(input: IYamlFile): input is IYamlFile<SMLMetric> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isMeasure);
  },
  isModelFile(input: IYamlFile): input is IYamlFile<SMLModel> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isModel);
  },
  isCompositeModelFile(input: IYamlFile): input is IYamlFile<SMLCompositeModel> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isCompositeModel);
  },
  isMeasureCalcFile(input: IYamlFile): input is IYamlFile<SMLMetricCalculated> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isMeasureCalc);
  },
  isCatalogFile(input: IYamlFile): input is IYamlFile<SMLCatalog> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isCatalog);
  },
  //TODO: IYamlFile uses SMLObject, but GlobalSettings uses SMLTypedObject
  // isGlobalSettingsFile(input: IYamlFile): input is IYamlFile<SMLGlobalSettings> {
  //   return isYamlFileOfType(input, YamlObjectTypeGuard.isGlobalSettings);
  // },
};

export default YamlObjectFileTypeGuard;
