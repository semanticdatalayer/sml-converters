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

export function convertSMLObjectsToYamlParsedFiles(compositeModelFiles: Array<SMLObject>): Array<IYamlParsedFile> {
  return compositeModelFiles.map((file) => convertSMLObjectToYamlParsedFile(file));
}