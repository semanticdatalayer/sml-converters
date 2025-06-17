import { SmlConverterResult, SmlConvertResultBuilder } from "./sml-convert-result";
import { SmlResultWriter } from "./sml-result-writer";
import { 
  SMLObject, 
  SMLObjectType,
  SMLModel,
  SMLCompositeModel,
  SMLCatalog,
  SMLConnection,
  SMLDataset,
  SMLDimension,
  SMLMetric,
  SMLMetricCalculated,
  SMLRowSecurity
} from "sml-sdk";
import { parseYaml } from "./yaml-parser";
import { getFilesAndFolders } from "./file-system-util";

import {Logger} from "./logger";
import fileSystem from 'fs/promises';
import path from 'path';

export class SmlFolderReader {
  static create(logger: Logger) {
    return new SmlResultWriter(logger);
  }
  constructor(private readonly logger: Logger) {}

  /**
   * Reads a directory of SML yaml files from the specified folder path 
   * and returns the conversion result as a SmlConverterResult
   *
   * @param folderPath - The path to the folder containing SML .yml objects to be read.
   * @returns A SmlConverterResult object containing the results of the conversion.
   */
  async readSmlObjects(folderPath: string): Promise<SmlConverterResult> {
    const someResult: SmlConvertResultBuilder = new SmlConvertResultBuilder();
    await this.readSmlObjectsRecursive(folderPath, someResult);
    return someResult.getResult();
  }

  /** Helper function for readSmlObject, goes through folders recursively to get all yml files */
  private async readSmlObjectsRecursive(folderPath: string, smlObjects: SmlConvertResultBuilder, recursionDepth = 0) {
    if (recursionDepth >= 100) {
      // we need quick circuit breaker
      throw new Error(`Max recursionDepth reached. Current folder: ${folderPath}`);
    }

    const { files, folders } = await getFilesAndFolders(folderPath);

    const readFilesPromises = files.map((file) => {
      return this.getSMLObject(path.join(folderPath, file))
    });

    const smlObjectsOrNot = await Promise.all(readFilesPromises);
    smlObjectsOrNot.forEach((smlObjectOrNot) => {
    if(smlObjectOrNot != undefined) {
      const objectType = smlObjectOrNot.object_type;
        switch (objectType) {
              case "catalog":
                smlObjects.catalog = smlObjectOrNot as SMLCatalog;
                break;
              case "model":
                smlObjects.addModel(smlObjectOrNot as SMLModel);
                break;
              case "dataset":
                smlObjects.addDatasets(smlObjectOrNot as SMLDataset);
                break;
              case "dimension":
                smlObjects.addDimension(smlObjectOrNot as SMLDimension);
                break;
              case "metric":
                smlObjects.addMeasures(smlObjectOrNot as SMLMetric);
                break;
              case "metric_calc":
                smlObjects.addMeasuresCalc(smlObjectOrNot as SMLMetricCalculated);
                break;
              case "connection":
                smlObjects.addConnection(smlObjectOrNot as SMLConnection);
                break;
              case "row_security":
                smlObjects.addRowSecurity(smlObjectOrNot as SMLRowSecurity);
                break;
              case "composite_model":
                smlObjects.addCompositeModel(smlObjectOrNot as SMLCompositeModel);
                break;
              default:
                this.logger.warn(`Object type of ${objectType} not recognized so object will be skipped`);
                break;
            }
    }});

    //run the same for subfolders
    await Promise.all(folders.map((folder) => this.readSmlObjectsRecursive(path.join(folderPath, folder), smlObjects, recursionDepth +1)))
  }

  
  /**
   * Reads a YAML file from the specified path, parses its content, and returns it as an `SMLObject` if valid.
   *
   * @param filePath - The path to the YAML file to be read.
   * @returns A SMLObject if the file is a valid YAML representation of an SML object, or `undefined` otherwise.
   */
  private async getSMLObject(filePath: string): Promise<SMLObject | undefined> {
     if (filePath.endsWith(".yml") || filePath.endsWith(".yaml")) {
        const fileStringContent = await fileSystem.readFile(filePath, "utf-8");
        const yamlObject = parseYaml(fileStringContent);

        const isSmlObject = isSMLObject(yamlObject);
        return isSmlObject ? yamlObject : undefined;
     }
     return undefined;
    }
}

/**
 * Determines whether the provided object conforms to the `SMLObject` interface.
 *
 * This function checks if the given object has the required properties:
 * - `object_type`: must be a valid value from the `SMLObjectType` enum.
 * - `label`: must be a string.
 * - `unique_name`: must be a string.
 *
 * @param smlObject - The object to test for SMLObject conformity.
 * @returns true if the checked object is an SMLObject, false otherwise
 */
export function isSMLObject(smlObject: any): smlObject is SMLObject {
    return (
        Object.values(SMLObjectType).includes(smlObject.object_type) &&
        typeof smlObject.label === 'string' &&
        typeof smlObject.unique_name === 'string'
    );
}
