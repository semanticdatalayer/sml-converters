import {
  ILevelAliasValidationOutputContext,
  ILevelAttributeValidationOutputContext,
  ILevelValidationOutputContext,
  ISecondaryAttributeValidationOutputContext,
} from "./IFileCompilationOutputContext";

export type IValidationOutputContext =
  | ILevelAttributeValidationOutputContext
  | ISecondaryAttributeValidationOutputContext
  | ILevelValidationOutputContext
  | ILevelAliasValidationOutputContext;

export interface ICompilationOutput {
  severity: Severity;
  message: string;
  context?: IValidationOutputContext;
  validationSource?: ValidationSource;
}

export enum Severity {
  Info = "info",
  Warning = "warning",
  Error = "error",
}

export enum ValidationSource {
  Engine = "engine",
  Compiler = "compiler",
}
export interface IFileCompilationOutput {
  relativePath: string;
  compilationOutput: Array<ICompilationOutput>;
}
