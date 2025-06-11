import { IFile } from "models/src/IFile";
import { Severity } from "models/src/IFileCompilationOutput";
import { IFolderStructure } from "models/src/IFolderStructure";
import { IYamlFile } from "models/src/IYamlFile";
import errorUtil from "utils/error.util";

import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";
import { CompilerRepoValidator, ICompilerValidator, isCompilerFolderValidator } from "./ICompilerValidator";

export class CompilerValidator implements ICompilerValidator {
  private validators: Array<{
    validator: CompilerRepoValidator;
    canProceedOnError: boolean;
    requireNoErrors?: boolean;
  }> = [];

  addValidator(validator: CompilerRepoValidator): ICompilerValidator {
    this.validators.push({ validator, canProceedOnError: true });
    return this;
  }

  addRequiredValidator(validator: CompilerRepoValidator): ICompilerValidator {
    this.validators.push({ validator, canProceedOnError: false });
    return this;
  }

  addValidatorIfNoErrorsSoFar(validator: CompilerRepoValidator, canProceedOnErrors = false): ICompilerValidator {
    this.validators.push({ validator, canProceedOnError: canProceedOnErrors, requireNoErrors: true });
    return this;
  }

  validate(elements: Array<IYamlFile>, rootFolder: IFolderStructure<IFile>): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();

    for (let index = 0; index < this.validators.length; index++) {
      const validator = this.validators[index];
      if (validator.requireNoErrors && validatorOutput.hasErrors) {
        break;
      }
      let currentValidatorOutput;
      try {
        if (isCompilerFolderValidator(validator.validator)) {
          currentValidatorOutput = validator.validator.validateFolderStructure(rootFolder);
        } else {
          currentValidatorOutput = validator.validator.validate(elements);
        }
      } catch (e) {
        const message = errorUtil.getErrorMessage(e);
        currentValidatorOutput = ValidatorOutput.create();
        currentValidatorOutput.addGlobalOutput(Severity.Error, message);
      }

      validatorOutput.append(currentValidatorOutput);
      if (!validator.canProceedOnError && currentValidatorOutput.hasErrors) {
        break;
      }
    }

    return validatorOutput;
  }
}
