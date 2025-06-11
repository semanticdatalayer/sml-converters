import {
  ILevelAliasValidationOutputContext,
  ILevelAttributeValidationOutputContext,
  ILevelValidationOutputContext,
  ISecondaryAttributeValidationOutputContext,
  OutputCompilationType,
} from "models/src/IFileCompilationOutputContext";

import IYamlErrorContextUtil, {
  YamlErrorContextInputProps,
  YamlLevelErrorContextInputProps,
} from "./IYamlErrorContexUtil";

export default class YamlErrorContextUtil implements IYamlErrorContextUtil {
  getLevelContext = (props: YamlLevelErrorContextInputProps): ILevelValidationOutputContext => {
    return {
      type: OutputCompilationType.Level,
      level: props.itemUniqueName,
      hierarchy: props.hierarchyUniqueName,
      message: props.message,
      validationType: props.validationType,
    };
  };

  getLevelAttributeContext = (props: YamlErrorContextInputProps): ILevelAttributeValidationOutputContext => {
    return {
      type: OutputCompilationType.LevelAttribute,
      levelAttribute: props.itemUniqueName,
      message: props.message,
      validationType: props.validationType,
    };
  };

  getSecondaryAttributeContext = (props: YamlErrorContextInputProps): ISecondaryAttributeValidationOutputContext => {
    return {
      type: OutputCompilationType.SecondaryAttribute,
      secondaryAttribute: props.itemUniqueName,
      message: props.message,
      validationType: props.validationType,
    };
  };

  getLevelAliasContext = (props: YamlErrorContextInputProps): ILevelAliasValidationOutputContext => {
    return {
      type: OutputCompilationType.LevelAlias,
      levelAlias: props.itemUniqueName,
      message: props.message,
      validationType: props.validationType,
    };
  };
}
