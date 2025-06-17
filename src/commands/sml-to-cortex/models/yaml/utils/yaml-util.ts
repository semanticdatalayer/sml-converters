import {
  SmlConverterResult,
} from "../../../../../shared/sml-convert-result";

/**
 * Converts an array of SMLObject instances into an array of IYamlParsedFile instances.
 * 
 * @param compositeModelFiles - The array of SML objects to convert.
 * @returns An array of `IYamlParsedFile` objects, each corresponding to an input SML object.
 */
import { SMLObject } from "sml-sdk";
import { ICompilationOutput, Severity } from "../../IFileCompilationOutput"
import IYamlParsedFile from "../../IYamlParsedFile";

export function convertSMLObjectToYamlParsedFile(compositeModelFile:SMLObject): IYamlParsedFile {
  const fakeCompOutput: ICompilationOutput = { 
    severity: Severity.Error,
    message: ""
  }
  const newFile: IYamlParsedFile<SMLObject> = 
  {
    data: compositeModelFile,
    compilationOutput: [fakeCompOutput],
    relativePath: "",
    rawContent: ""
  };
  return newFile;
}

/**
 * Converts an array of SMLObject instances into an array of IYamlParsedFile objects.
 *
 * @param SMLModelFiles - An array of SMLObject, specifically SMLModels, instances to be converted.
 * @returns An array of IYamlParsedFile objects resulting from the conversion of each SMLObject.
 */
export function convertSMLObjectsToYamlParsedFiles(SMLModelFiles: Array<SMLObject>): Array<IYamlParsedFile> {
  return SMLModelFiles.map((file) => convertSMLObjectToYamlParsedFile(file));
}