import {
  SMLCatalog,
  SMLCompositeModel,
  SMLConnection,
  SMLDataset,
  SMLDimension,
  SMLGlobalSettings,
  SMLMetric,
  SMLMetricCalculated,
  SMLTypedObject,
  SMLModel,
  SMLObjectType
} from 'sml-sdk'

const isType = (input: SMLTypedObject, objType: SMLObjectType): boolean => {
  return input.object_type === objType;
};

const SmlObjectTypeGuard = {
  isConnection(input: SMLTypedObject): input is SMLConnection {
    return isType(input, SMLObjectType.Connection);
  },
  isDataset(input: SMLTypedObject): input is SMLDataset {
    return isType(input, SMLObjectType.Dataset);
  },
  isDimension(input: SMLTypedObject): input is SMLDimension {
    return isType(input, SMLObjectType.Dimension);
  },
  isMeasure(input: SMLTypedObject): input is SMLMetric {
    return isType(input, SMLObjectType.Metric);
  },
  isModel(input: SMLTypedObject): input is SMLModel {
    return isType(input, SMLObjectType.Model);
  },
  isCompositeModel(input: SMLTypedObject): input is SMLCompositeModel {
    return isType(input, SMLObjectType.CompositeModel);
  },
  isMeasureCalc(input: SMLTypedObject): input is SMLMetricCalculated {
    return isType(input, SMLObjectType.MetricCalc);
  },
  isCatalog(input: SMLTypedObject): input is SMLCatalog {
    return isType(input, SMLObjectType.Catalog);
  },
  isGlobalSettings(input: SMLTypedObject): input is SMLGlobalSettings {
    return isType(input, SMLObjectType.GlobalSettings);
  },
};

export default SmlObjectTypeGuard;
