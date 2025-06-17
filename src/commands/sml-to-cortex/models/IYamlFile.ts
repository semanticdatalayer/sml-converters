import { IFile } from "./IFile";
import { SMLObject } from "sml-sdk";

export interface IYamlFile<T extends SMLObject = SMLObject> extends IFile {
  data: T;
  rawContent: string;
}

export interface IYamlPartialFile<T extends Partial<SMLObject> = Partial<SMLObject>> extends IFile {
  data: T;
  rawContent: string;
}
