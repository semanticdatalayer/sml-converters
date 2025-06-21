import { SMLMetric, SMLMetricCalculated } from 'sml-sdk';
import TypeGuardUtil from "./type-guard-util";

export default class SmlMeasureTypeGuard {
  static isCalcMeasure = (input: SMLMetric | SMLMetricCalculated): input is SMLMetricCalculated =>
    TypeGuardUtil.hasProps(input, "expression") && TypeGuardUtil.hasNoProps(input, "dataset", "column");

  static isRegularMeasure = (input: SMLMetric | SMLMetricCalculated): input is SMLMetric =>
    TypeGuardUtil.hasProps(input, "dataset", "column") && TypeGuardUtil.hasNoProps(input, "expression");
}
