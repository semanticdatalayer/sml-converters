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
  SMLModel
} from 'sml-sdk'

// import { IYamlCatalog as SMLCatalog } from "../IYamlCatalog";
// import { IYamlCompositeModel as SMLCompositeModel } from "../IYamlCompositeModel";
// import { IYamlConnection as SMLConnection } from "../IYamlConnection";
// import { IYamlDataset as SMLDataset } from "../IYamlDataset";
// import { IYamlDimension as SMLDimension } from "../IYamlDimension";
// import { IYamlGlobalSettings as SMLGlobalSettings } from "../IYamlGlobalSettings";
// import { IYamlMeasure as SMLMetric } from "../IYamlMeasure";
// import { IYamlModel as SMLModel } from "../IYamlModel";
// import { IYamlObject as SMLObject } from "../IYamlObject";
// import { IYamlMeasureCalculated as SMLMetricCalculated } from "./../IYamlMeasure";
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
  isGlobalSettingsFile(input: IYamlFile): input is IYamlFile<SMLGlobalSettings> {
    return isYamlFileOfType(input, YamlObjectTypeGuard.isGlobalSettings);
  },
};

export default YamlObjectFileTypeGuard;
