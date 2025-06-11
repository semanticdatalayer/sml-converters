import { IFile } from "models/src/IFile";
import { ICompilationOutput } from "models/src/IFileCompilationOutput";
import { IFolderStructure } from "models/src/IFolderStructure";
import { IYamlFile } from "models/src/IYamlFile";
import TypeGuardUtil from "models/src/yaml/guards/type-guard-util";

import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";

export interface IValidatorCompilationOutput {
  compilationOutput: Array<ICompilationOutput>;
}

export interface ICompilerValidatorFn {
  validate(elements: Array<IYamlFile>): ValidatorOutput;
}

export interface ICompilerFolderValidator {
  isFolderValidator: boolean;
  validateFolderStructure(rootFolder: IFolderStructure<IFile>): ValidatorOutput;
}

export type CompilerRepoValidator = ICompilerValidatorFn | ICompilerFolderValidator;

export const isCompilerFolderValidator = (validator: CompilerRepoValidator): validator is ICompilerFolderValidator => {
  return TypeGuardUtil.hasProps<ICompilerFolderValidator>(validator, "isFolderValidator");
};

export interface ICompilerValidator {
  addValidator(validator: CompilerRepoValidator): ICompilerValidator;
  addRequiredValidator(validator: CompilerRepoValidator): ICompilerValidator;
  addValidatorIfNoErrorsSoFar(validator: CompilerRepoValidator, canProceedOnErrors?: boolean): ICompilerValidator;
  validate(elements: Array<IYamlFile>, rootFolder: IFolderStructure<IFile>): ValidatorOutput;
}
