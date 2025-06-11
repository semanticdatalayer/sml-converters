import { IFile } from "models/src/IFile";
import { IFolderStructure } from "models/src/IFolderStructure";

import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";

export interface IRepoReader {
  parseFolder(rootFolder: string, validatorOutput?: ValidatorOutput): Promise<IFolderStructure<IFile>>;
}
