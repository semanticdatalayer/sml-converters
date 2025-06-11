import { IFile } from "./IFile";
import { IYamlObject } from "./yaml/IYamlObject";

export interface IYamlFile<T extends IYamlObject = IYamlObject> extends IFile {
  data: T;
  rawContent: string;
}

export interface IYamlPartialFile<T extends Partial<IYamlObject> = Partial<IYamlObject>> extends IFile {
  data: T;
  rawContent: string;
}
