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
  SMLModel,
  SMLObjectType
} from 'sml-sdk'

// import { SMLObjectType } from "../../SMLObjectType";
// import { SMLCatalog } from "../SMLCatalog";
// import { SMLCompositeModel } from "../SMLCompositeModel";
// import { SMLConnection } from "../SMLConnection";
// import { SMLDataset } from "../SMLDataset";
// import { SMLDimension } from "../SMLDimension";
// import { SMLGlobalSettings } from "../SMLGlobalSettings";
// import { SMLMeasure } from "../SMLMeasure";
// import { SMLModel } from "../SMLModel";
// import { SMLObject } from "../SMLObject";
// import { SMLMeasureCalculated } from "./../SMLMeasure";

const isType = (input: SMLObject, objType: SMLObjectType): boolean => {
  return input.object_type === objType;
};

const YamlObjectTypeGuard = {
  isConnection(input: SMLObject): input is SMLConnection {
    return isType(input, SMLObjectType.Connection);
  },
  isDataset(input: SMLObject): input is SMLDataset {
    return isType(input, SMLObjectType.Dataset);
  },
  isDimension(input: SMLObject): input is SMLDimension {
    return isType(input, SMLObjectType.Dimension);
  },
  isMeasure(input: SMLObject): input is SMLMetric {
    return isType(input, SMLObjectType.Metric);
  },
  isModel(input: SMLObject): input is SMLModel {
    return isType(input, SMLObjectType.Model);
  },
  isCompositeModel(input: SMLObject): input is SMLCompositeModel {
    return isType(input, SMLObjectType.CompositeModel);
  },
  isMeasureCalc(input: SMLObject): input is SMLMetricCalculated {
    return isType(input, SMLObjectType.MetricCalc);
  },
  isCatalog(input: SMLObject): input is SMLCatalog {
    return isType(input, SMLObjectType.Catalog);
  },
  isGlobalSettings(input: SMLObject): input is SMLGlobalSettings {
    return isType(input, SMLObjectType.GlobalSettings);
  },
};

export default YamlObjectTypeGuard;
