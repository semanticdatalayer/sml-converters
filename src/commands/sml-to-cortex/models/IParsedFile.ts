import IRawFile from "./IRawFile";
import { IValidatorCompilationOutput } from "./IValidatorCompilationOutput";

export interface IParsedFile<T = object | string> extends IRawFile, IValidatorCompilationOutput {
  data: T;
}
