import { IFile } from "models/src/IFile";
import { Severity } from "models/src/IFileCompilationOutput";
import { IFolderStructure } from "models/src/IFolderStructure";
import { ObjectType } from "models/src/ObjectType";
import { OriginType } from "models/src/SourceType";
import TypeGuardUtil from "models/src/yaml/guards/type-guard-util";
import YamlObjectTypeGuard from "models/src/yaml/guards/yaml-object-type-guard";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import pathUtil from "utils/path.util";

import FolderStructureUtil from "../../../utils/folder-structure.util";
import ValidatorOutput from "../../../ValidatorOutput/ValidatorOutput";
import { ICompilerFolderValidator } from "../../ICompilerValidator";

export const globalSettingsFileErrors = {
  missing: `Missing file with name ${ObjectType.GlobalSettings}, in the root folder`,
  moreThanOne: `There is more than one ${ObjectType.GlobalSettings} file in the root folder`,
  exists: `File with type ${ObjectType.GlobalSettings} exists in non global settings repository`,
  otherYamlFiles: `Unknown yml file(s) exist in the global settings repository. Delete all yml/yaml files except the file with the name global_settings.yml/yaml`,
  objectTypeMissing: "object_type is missing",
  notCorrectObjType: `the file name suggests its object_type to be ${ObjectType.GlobalSettings}`,
  notCorrectFileName: `the file object_type suggests its name to be ${ObjectType.GlobalSettings}`,
  notInRoot: "file is not located in the root folder",
};

export const GLOBAL_SETTINGS_FILE_NAMES = ["global_settings.yaml", "global_settings.yml"];

export class YamlGlobalSettingsValidator implements ICompilerFolderValidator {
  isFolderValidator = true;
  static create(isGlobalSettingsRepo: boolean): YamlGlobalSettingsValidator {
    return new YamlGlobalSettingsValidator(isGlobalSettingsRepo);
  }
  constructor(private readonly isGlobalSettingsRepo: boolean) {}

  validateFolderStructure(rootFolder: IFolderStructure<IFile>): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();

    this.verifyGlobalSettingsFile(rootFolder, validatorOutput);

    return validatorOutput;
  }

  private verifyGlobalSettingsFile(rootFolder: IFolderStructure<IFile>, validatorOutput: ValidatorOutput): void {
    if (!this.isGlobalSettingsRepo) {
      if (this.doesGlobalSettingsFileExist(rootFolder)) {
        validatorOutput.addGlobalOutput(Severity.Error, globalSettingsFileErrors.exists);
      }

      return;
    }

    const globalSettingsRootFileCount = this.getCountFromRoot(
      rootFolder.files,
      GLOBAL_SETTINGS_FILE_NAMES,
      validatorOutput
    );
    const globalSettingsFileDoesNotExist = globalSettingsRootFileCount === 0;
    const globalSettingsFileMoreThanOne = globalSettingsRootFileCount > 1;

    if (globalSettingsFileDoesNotExist) {
      validatorOutput.addGlobalOutput(Severity.Error, globalSettingsFileErrors.missing);
    }
    if (globalSettingsFileMoreThanOne) {
      validatorOutput.addGlobalOutput(Severity.Error, globalSettingsFileErrors.moreThanOne);
    }
    if (this.otherYamlFilesExist(rootFolder)) {
      validatorOutput.addGlobalOutput(Severity.Error, globalSettingsFileErrors.otherYamlFiles);
    }

    FolderStructureUtil.traverse(rootFolder, (file) => {
      this.validateGlobalSettingsFile(file, validatorOutput);
      this.validateFileNameByObjectType(file, validatorOutput);
    });
  }

  private doesGlobalSettingsFileExist(rootFolder: IFolderStructure<IFile>) {
    let exists = false;

    FolderStructureUtil.traverse(rootFolder, (file) => {
      if (file.data?.object_type === ObjectType.GlobalSettings) {
        exists = true;
      }
    });

    return exists;
  }

  private getCountFromRoot(filesToCheck: Array<IFile>, fileNames: string[], validatorOutput: ValidatorOutput): number {
    let count = 0;
    filesToCheck.forEach((file) => {
      const fileName = pathUtil.getFileNameFromPath(file.relativePath);
      if (fileNames.includes(fileName)) {
        this.validateFileObjectType(file, validatorOutput);
        count++;
      }
    });
    return count;
  }

  private validateFileObjectType(globalSettingsFile: IFile, validatorOutput: ValidatorOutput): void {
    if (!globalSettingsFile.data || TypeGuardUtil.hasNoProps(globalSettingsFile.data, "object_type")) {
      validatorOutput.file(globalSettingsFile).addError(globalSettingsFileErrors.objectTypeMissing);
    } else if (!YamlObjectTypeGuard.isGlobalSettings(globalSettingsFile.data as IYamlObject)) {
      validatorOutput.file(globalSettingsFile).addError(globalSettingsFileErrors.notCorrectObjType);
    }
  }

  private otherYamlFilesExist(foldersWithFiles: IFolderStructure<IFile>): boolean {
    let otherYamlFilesExist = false;

    FolderStructureUtil.traverse(foldersWithFiles, (file) => {
      const extension = pathUtil.getExtensionFromPath(file.relativePath);
      const isYamlFile = extension && ["yaml", "yml"].includes(extension);

      const fileName = pathUtil.getFileNameFromPath(file.relativePath);
      const isGlobalSettingsFile = GLOBAL_SETTINGS_FILE_NAMES.includes(fileName);

      if (isYamlFile && !isGlobalSettingsFile) {
        otherYamlFilesExist = true;
      }
    });

    return otherYamlFilesExist;
  }

  private validateGlobalSettingsFile(file: IFile, validatorOutput: ValidatorOutput) {
    if (!pathUtil.isFileOnRootLevel(file.relativePath) && file.origin === OriginType.Root) {
      const fileName = pathUtil.getFileNameFromPath(file.relativePath);
      if (GLOBAL_SETTINGS_FILE_NAMES.includes(fileName)) {
        validatorOutput.file(file).addError(globalSettingsFileErrors.notInRoot);
      }
    }
  }

  private validateFileNameByObjectType(file: IFile, validatorOutput: ValidatorOutput) {
    if ((file.data as IYamlObject)?.object_type === ObjectType.GlobalSettings) {
      const fileName = pathUtil.getFileNameFromPath(file.relativePath);
      if (!GLOBAL_SETTINGS_FILE_NAMES.includes(fileName)) {
        validatorOutput.file(file).addError(globalSettingsFileErrors.notCorrectFileName);
      }
    }
  }
}
