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

export const catalogFileErrors = {
  missing: `Missing file with name ${ObjectType.Catalog}, in the root folder`,
  moreThanOne: `There are more than one files from type ${ObjectType.Catalog} in the root folder`,
  notInRoot: "file is not located in the root folder",
  objectTypeMissing: "object_type is missing",
  notCorrectObjType: `the file name suggests its object_type to be ${ObjectType.Catalog}`,
  notCorrectFileName: `the file object_type suggests its name to be ${ObjectType.Catalog}`,
};

export const catalogFileWarnings = {
  atscaleFileDeprecated: "atscale.yml is deprecated, please rename the file to catalog.yml",
};

const CATALOG_FILES = {
  deprecated: ["atscale.yaml", "atscale.yml"],
  unique: ["catalog.yaml", "catalog.yml"],
  get all() {
    return [...this.unique, ...this.deprecated];
  },
};

export class YamlGlobalFolderStructureValidator implements ICompilerFolderValidator {
  isFolderValidator = true;
  static create(): YamlGlobalFolderStructureValidator {
    return new YamlGlobalFolderStructureValidator();
  }

  validateFolderStructure(rootFolder: IFolderStructure<IFile>): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();

    this.verifyCatalogFile(rootFolder, validatorOutput);
    return validatorOutput;
  }

  private validateFileObjectType(catalogFile: IFile, validatorOutput: ValidatorOutput): void {
    if (!catalogFile.data || TypeGuardUtil.hasNoProps(catalogFile.data, "object_type")) {
      validatorOutput.file(catalogFile).addError(catalogFileErrors.objectTypeMissing);
    } else if (!YamlObjectTypeGuard.isCatalog(catalogFile.data as IYamlObject)) {
      validatorOutput.file(catalogFile).addError(catalogFileErrors.notCorrectObjType);
    }
  }

  private getCountFromRoot(
    filesToCheck: Array<IFile>,
    fileUniqueNames: string[],
    validatorOutput: ValidatorOutput
  ): number {
    let count = 0;
    filesToCheck.forEach((file) => {
      const fileName = pathUtil.getFileNameFromPath(file.relativePath);
      if (fileUniqueNames.includes(fileName)) {
        this.validateFileObjectType(file, validatorOutput);
        count++;
      }
    });
    return count;
  }

  private checkSubFoldersForCatalogFiles(file: IFile, validatorOutput: ValidatorOutput) {
    if (!pathUtil.isFileOnRootLevel(file.relativePath) && file.origin === OriginType.Root) {
      const fileName = pathUtil.getFileNameFromPath(file.relativePath);
      if (CATALOG_FILES.all.includes(fileName)) {
        validatorOutput.file(file).addError(catalogFileErrors.notInRoot);
      }
    }
  }

  private validateFileNamesByObjectType(file: IFile, validatorOutput: ValidatorOutput) {
    if ((file.data as IYamlObject)?.object_type === ObjectType.Catalog) {
      const fileName = pathUtil.getFileNameFromPath(file.relativePath);
      if (!CATALOG_FILES.all.includes(fileName)) {
        validatorOutput.file(file).addError(catalogFileErrors.notCorrectFileName);
      }
    }
  }

  private isNoCatalogFiles(catalogFilesCount: number, atscaleFilesCount: number): boolean {
    return catalogFilesCount === 0 && atscaleFilesCount === 0;
  }

  private isTooManyCatalogFiles(catalogFilesCount: number, atscaleFilesCount: number): boolean {
    return catalogFilesCount > 1 || atscaleFilesCount > 1 || (catalogFilesCount === 1 && atscaleFilesCount === 1);
  }

  private isOnlyDeprecatedCatalogFile(catalogFilesCount: number, atscaleFilesCount: number): boolean {
    return catalogFilesCount === 0 && atscaleFilesCount === 1;
  }

  private handleTooManyCatalogFiles(validatorOutput: ValidatorOutput): void {
    validatorOutput.addGlobalOutput(Severity.Error, catalogFileErrors.moreThanOne);
    validatorOutput.addGlobalOutput(Severity.Warning, catalogFileWarnings.atscaleFileDeprecated);
  }

  private handleDeprecatedCatalogFile(
    foldersWithFiles: IFolderStructure<IFile>,
    validatorOutput: ValidatorOutput
  ): void {
    validatorOutput.addGlobalOutput(Severity.Warning, catalogFileWarnings.atscaleFileDeprecated);
    this.processFiles(foldersWithFiles, validatorOutput);
  }

  private processFiles(foldersWithFiles: IFolderStructure<IFile>, validatorOutput: ValidatorOutput): void {
    FolderStructureUtil.traverse(foldersWithFiles, (file) => {
      this.checkSubFoldersForCatalogFiles(file, validatorOutput);
      this.validateFileNamesByObjectType(file, validatorOutput);
    });
  }

  private async verifyCatalogFile(foldersWithFiles: IFolderStructure<IFile>, validatorOutput: ValidatorOutput) {
    const catalogFilesCount = this.getCountFromRoot(foldersWithFiles.files, CATALOG_FILES.unique, validatorOutput);
    const atscaleFilesCount = this.getCountFromRoot(foldersWithFiles.files, CATALOG_FILES.deprecated, validatorOutput);

    if (this.isNoCatalogFiles(catalogFilesCount, atscaleFilesCount)) {
      validatorOutput.addGlobalOutput(Severity.Error, catalogFileErrors.missing);
    } else if (this.isTooManyCatalogFiles(catalogFilesCount, atscaleFilesCount)) {
      this.handleTooManyCatalogFiles(validatorOutput);
    } else if (this.isOnlyDeprecatedCatalogFile(catalogFilesCount, atscaleFilesCount)) {
      this.handleDeprecatedCatalogFile(foldersWithFiles, validatorOutput);
    } else {
      this.processFiles(foldersWithFiles, validatorOutput);
    }
  }
}
