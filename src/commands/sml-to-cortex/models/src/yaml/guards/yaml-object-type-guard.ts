import { ObjectType } from "../../ObjectType";
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

const isType = (input: IYamlObject, objType: ObjectType): boolean => {
  return input.object_type === objType;
};

const YamlObjectTypeGuard = {
  isConnection(input: IYamlObject): input is IYamlConnection {
    return isType(input, ObjectType.Connection);
  },
  isDataset(input: IYamlObject): input is IYamlDataset {
    return isType(input, ObjectType.Dataset);
  },
  isDimension(input: IYamlObject): input is IYamlDimension {
    return isType(input, ObjectType.Dimension);
  },
  isMeasure(input: IYamlObject): input is IYamlMeasure {
    return isType(input, ObjectType.Measure);
  },
  isModel(input: IYamlObject): input is IYamlModel {
    return isType(input, ObjectType.Model);
  },
  isCompositeModel(input: IYamlObject): input is IYamlCompositeModel {
    return isType(input, ObjectType.CompositeModel);
  },
  isMeasureCalc(input: IYamlObject): input is IYamlMeasureCalculated {
    return isType(input, ObjectType.MeasureCalc);
  },
  isCatalog(input: IYamlObject): input is IYamlCatalog {
    return isType(input, ObjectType.Catalog);
  },
  isGlobalSettings(input: IYamlObject): input is IYamlGlobalSettings {
    return isType(input, ObjectType.GlobalSettings);
  },
};

export default YamlObjectTypeGuard;
