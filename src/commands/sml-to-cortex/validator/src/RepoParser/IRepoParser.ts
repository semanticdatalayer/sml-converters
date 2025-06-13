import { EnvFileData, IFile } from "../../../models/src/IFile";
import { IFolderStructure } from "../../../models/src/IFolderStructure";
import { IYamlFile } from "../../../models/src/IYamlFile";

import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";

export interface IRepoParser {
  extractYamlFiles(folderStructure: IFolderStructure<IFile>, validatorOutput: ValidatorOutput): Array<IYamlFile>;
  getYamlFilesWithValidObjectType(parsedFiles: Array<IFile>, validatorOutput: ValidatorOutput): Array<IYamlFile>;
  parseFolderStructure(folder: IFolderStructure<IFile>, validatorOutput: ValidatorOutput): IFolderStructure<IFile>;
  parseFile(file: IFile, validatorOutput: ValidatorOutput, environmentVariables?: EnvFileData): IFile;
}
