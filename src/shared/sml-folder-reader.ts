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

  async readSmlObjects(folderPath: string): Promise<SmlConverterResult> {
    const someResult: SmlConvertResultBuilder = new SmlConvertResultBuilder();
    await this.readSmlObjectsRecursive(folderPath, someResult);
    return someResult.getResult();
  }

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
      //TODO: copied from snow-converter.ts
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

export function isSMLObject(smlObject: any): smlObject is SMLObject {
    //check whether it is an sml object. It has to have those 3 props:
    // object_type, label, unique_name. 
    // And object type should be one of the values in the enum: SMLObjectType;
    return (
        Object.values(SMLObjectType).includes(smlObject.object_type) &&
        typeof smlObject.label === 'string' &&
        typeof smlObject.unique_name === 'string'
    );
}
