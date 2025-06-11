import { IFile } from "models/src/IFile";
import { Severity } from "models/src/IFileCompilationOutput";
import { IFolderStructure } from "models/src/IFolderStructure";
import { PACKAGE_FILE_NAME } from "models/src/yaml/IYamlPackageFile";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import { ICompilerFolderValidator } from "../../../ICompilerValidator";

export class SubmoduleValidator implements ICompilerFolderValidator {
  isFolderValidator = true;
  static create(): SubmoduleValidator {
    return new SubmoduleValidator();
  }

  validateFolderStructure(rootFolder: IFolderStructure<IFile>): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();

    //add warning if submodule file is still there
    if (rootFolder.files.some((f) => f.relativePath === ".gitmodules")) {
      validatorOutput.addGlobalOutput(
        Severity.Warning,
        `Git submodules are no longer supported. A '.gitmodules' file is detected in the repository. Consider using ${PACKAGE_FILE_NAME} file`
      );
    }

    return validatorOutput;
  }
}
