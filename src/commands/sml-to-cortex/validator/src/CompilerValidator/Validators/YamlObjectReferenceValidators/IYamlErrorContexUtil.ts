import {
  ILevelAliasValidationOutputContext,
  ILevelAttributeValidationOutputContext,
  ILevelValidationOutputContext,
  ISecondaryAttributeValidationOutputContext,
  OutputValidationType,
} from "models/src/IFileCompilationOutputContext";

export interface YamlErrorContextInputProps {
  itemUniqueName: string;
  message: string;
  validationType: OutputValidationType;
}

export interface YamlLevelErrorContextInputProps extends YamlErrorContextInputProps {
  hierarchyUniqueName: string;
}

export default interface IYamlErrorContextUtil {
  getLevelContext: (props: YamlLevelErrorContextInputProps) => ILevelValidationOutputContext;
  getLevelAttributeContext: (props: YamlErrorContextInputProps) => ILevelAttributeValidationOutputContext;
  getSecondaryAttributeContext: (props: YamlErrorContextInputProps) => ISecondaryAttributeValidationOutputContext;
  getLevelAliasContext: (props: YamlErrorContextInputProps) => ILevelAliasValidationOutputContext;
}
