import {IFile} from "../../../models/src/IFile"
import { ICompilationOutput, IFileCompilationOutput } from "../../../models/src/IFileCompilationOutput";
import { IFolderStructure } from "../../../models/src/IFolderStructure";
import { IYamlFile } from "../../../models/src/IYamlFile";

export interface IRepoValidatorResult {
  filesOutput: Array<IFileCompilationOutput>;
  globalOutput: Array<ICompilationOutput>;
}

export interface IRepoValidator {
  validateRepo(rootFolder: IFolderStructure<IFile>, isGlobalSettingsRepo: boolean): IRepoValidatorResult;
  validateYamlFiles(
    yamlFiles: Array<IYamlFile>,
    rootFolder: IFolderStructure<IFile>,
    isGlobalSettingsRepo?: boolean
  ): IRepoValidatorResult;
}
