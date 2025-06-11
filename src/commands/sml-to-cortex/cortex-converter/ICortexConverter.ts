import { IFile } from "models/src/IFile";
import { IFolderStructure } from "models/src/IFolderStructure";

import { ISnowModel } from "./snow-model";

export interface ICortexConverterResult {
  filesOutput: Array<ISnowModel>;
}

export interface ICortexConverter {
  convertRepo(rootFolder: IFolderStructure<IFile>): Promise<ICortexConverterResult>;
  convertYamlFiles(rootFolder: string): Promise<ICortexConverterResult>;
}
