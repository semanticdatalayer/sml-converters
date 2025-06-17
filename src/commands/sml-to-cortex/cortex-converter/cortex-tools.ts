import { IYamlFile } from "../models/IYamlFile";
import IYamlParsedFile from "../models/IYamlParsedFile";
import { OriginType } from "../models/SourceType";

import { SMLObject } from "sml-sdk";

import { Constants } from "./cortex-converter";

/**
 * Converts an array of parsed YAML files into an array of YAML file objects.
 *
 * @param parsedFiles - An array of parsed YAML files of type `IYamlParsedFile<SMLObject>`.
 * @returns An array of `IYamlFile<SMLObject>` objects constructed from the parsed files.
 */
export function parsedFilesToFiles(parsedFiles: IYamlParsedFile<SMLObject>[]): IYamlFile<SMLObject>[] {
  const newFiles: IYamlFile<SMLObject>[] = new Array<IYamlFile<SMLObject>>();
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
    Constants.FILTER_VALUES.some((item) => noQuotes(item).toLowerCase().includes(noQuotes(val).toLowerCase()))
  ) {
    console.log(`FFF ${msg}`);
  }
}

/**
 * Determines whether the provided string value is present in the list of filtered values.
 *
 * The comparison is case-insensitive and ignores surrounding quotes in both the input value
 * and the filter values.
 *
 * @param val - The string value to check against the filter list.
 * @returns `true` if the value is found in `Constants.FILTER_VALUES`, otherwise `false`.
 */
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

/**
 * Returns a new array with the elements sorted alphabetically based on the string value
 * returned by the provided selector function.
 *
 * @typeParam T - The type of elements in the input array.
 * @param array - The array of elements to sort.
 * @param selector - A function that takes an element and returns a string to use for sorting.
 * @returns A new array sorted alphabetically by the selected string value.
 */
export const sortAlphabetically = <T>(
  array: T[],
  selector: (el: T) => string
): T[] => {
  return [...array].sort((a, b) => selector(a).localeCompare(selector(b)));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepFreeze(o: any) {
  Object.freeze(o);

  Object.getOwnPropertyNames(o).forEach((prop) => {
    if (Object.prototype.hasOwnProperty.call(o, prop) &&
      o[prop] !== null &&
      (typeof o[prop] === "object" || typeof o[prop] === "function") &&
      !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });

  return o;
}
