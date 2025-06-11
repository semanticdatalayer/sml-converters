import { FILE_TYPE } from "models/src/FileType";
import { IYamlFile } from "models/src/IYamlFile";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { OriginType } from "models/src/SourceType";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import { Constants } from "./CortexConverter";

export function parsedFilesToFiles(parsedFiles: IYamlParsedFile<IYamlObject>[]): IYamlFile<IYamlObject>[] {
  const newFiles: IYamlFile<IYamlObject>[] = new Array<IYamlFile<IYamlObject>>();
  parsedFiles.forEach((parsedFile) => {
    newFiles.push({
      compilationOutput: parsedFile.compilationOutput,
      data: parsedFile.data,
      rawContent: parsedFile.rawContent,
      relativePath: parsedFile.relativePath,
      type: parsedFile.data.object_type,
      origin: OriginType.Root,
      packageName: "",
    } as IYamlFile);
  });
  return newFiles;
}

export const testConstants = {
  CATALOG_NAME: "Test Catalog",
  MODEL_NAME: "Test Model",
  COMPOSITE_MODEL_NAME: "Test Composite",
  SECOND_MODEL_NAME: "Test Second Model",
};

export function shortStack(): string {
  const stack = new Error().stack;
  if (!stack) {
    return "No stack trace available.";
  }

  // Split the stack trace into an array of lines, and take the last 4 calls
  const stackLines = stack.split("\n").slice(2, 6); // Skip the first 2 lines and take the next 4 lines

  // Extract the function name, file name (excluding the path), and line numbers from each line, and format it
  const formattedCalls = stackLines.map((line) => {
    const match = line.match(/at (.*) \((.*):(\d+):(\d+)\)/);
    if (match) {
      const fileName = match[2].split("/").pop(); // Extract the file name (last part of the path)
      const lineNumber = match[3]; // Capture the line number
      const columnNumber = match[4]; // Capture the column number
      return `${match[1]} @ ${fileName}:${lineNumber}:${columnNumber}`;
    }
    return line.trim(); // If the line doesn't match the expected pattern, return it as is
  });

  return formattedCalls.join(" | ");
}

export function printFilteredMessage(val: string, msg: string) {
  if (
    Constants.PRINT_MESSAGES &&
    // Constants.FILTER_VALUES.some((item) => noQuotes(item).toLowerCase === noQuotes(val).toLowerCase)
    Constants.FILTER_VALUES.some((item) => noQuotes(item).toLowerCase().includes(noQuotes(val).toLowerCase()))
  ) {
    console.log(`FFF ${msg}`);
  }
}

export function isFiltered(val: string): boolean {
  let found = false;
  if (val && Constants.FILTER_VALUES) {
    Constants.FILTER_VALUES.forEach((item) => {
      if (noQuotes(item).toLowerCase() === noQuotes(val).toLowerCase()) {
        found = true;
      }
    });
  }
  return found;
}

export function noQuotes(field: string): string {
  return field.toString().replace(/["']/g, "");
}

export const sortAlphabetically = <T>(
  array: T[],
  selector: (el: T) => string
): T[] => {
  return [...array].sort((a, b) => selector(a).localeCompare(selector(b)));
};
