import { IYamlMeasure, IYamlMeasureCalculated } from "../IYamlMeasure";
import TypeGuardUtil from "./type-guard-util";

export default class YamlMeasureTypeGuard {
  static isCalcMeasure = (input: IYamlMeasure | IYamlMeasureCalculated): input is IYamlMeasureCalculated =>
    TypeGuardUtil.hasProps(input, "expression") && TypeGuardUtil.hasNoProps(input, "dataset", "column");

  static isRegularMeasure = (input: IYamlMeasure | IYamlMeasureCalculated): input is IYamlMeasure =>
    TypeGuardUtil.hasProps(input, "dataset", "column") && TypeGuardUtil.hasNoProps(input, "expression");
}
