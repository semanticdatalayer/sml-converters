import {
  SMLModel,
  SMLObject,
  SMLObjectType,
} from "sml-sdk";

import {
  SmlConverterResult,
} from "../../../shared/sml-convert-result";

import {
  SmlFolderReader
} from "../../../shared/sml-folder-reader"

import { Logger } from "../../../shared/logger";

import { IYamlFile } from "../models/src/IYamlFile"; //TODO:, only in validator
import IYamlParsedFile from "../models/src/IYamlParsedFile"; //TODO: can't find it, only in validator
import { convertCompositeModel } from "../utils/composite-model-util";

import { ICortexConverterResult } from "./ICortexConverter";  // will be in model file
import { Convert } from "./snow-converter";
import { ISnowModel } from "./snow-model";
import { flatRepoFromPath } from "./validator";
import {ICompilationOutput, Severity, ValidationSource} from "../models/src/IFileCompilationOutput"

export const Constants = {
  DO_MAP_DATASETS_TO_DIMS: false,
  PRINT_MESSAGES: true,
  FILTER_VALUES: ["cs_list_price", "cs list price"],
};

type CortexConverterDependencies = {
  smlFilesPath?: string;
  smlFiles?: Array<IYamlFile>;
  logger: Logger;
  doMapDatasetsToDims: boolean;
};

export default class CortexConverter {
  // dependencies: CortexConverterDependencies;
  private logger: Logger;
  private smlFilesPath?: string;
  private smlFiles?: Array<IYamlFile>;
  private doMapDatasetsToDims: boolean;

  constructor(deps: CortexConverterDependencies) {
    // const defaultDep: CortexConverterDependencies = {
    //   smlFilesPath: undefined,
    //   logger: new CommandLogger(),
    //   doMapDatasetsToDims: false,
    // };

    // this.dependencies = Object.assign(defaultDep, deps);
    this.logger = deps.logger;
    this.smlFilesPath = deps.smlFilesPath;
    this.smlFiles = deps.smlFiles;
    this.doMapDatasetsToDims = deps.doMapDatasetsToDims;
  }

  async convertYamlFiles(rootFolder: string): Promise<ICortexConverterResult> {
    // const smlFiles: Array<IYamlFile> = await flatRepoFromPath(rootFolder, this.logger);

    const smlReader = new SmlFolderReader(this.logger);
    const smlConverterResult = await smlReader.readSmlObjects(rootFolder);
    const cortexConversionOutput: Array<ISnowModel> = await this.createCortexOutput(smlConverterResult);

    return { filesOutput: cortexConversionOutput };
  }

  async createCortexOutput(smlObjects: SmlConverterResult): Promise<ISnowModel[]> {
    const cortexConversionOutput = new Array<ISnowModel>();
    // const smlObjects: SmlConverterResult = makeResultFromFileList(smlFiles, this.logger);

    for (const model of smlObjects.models) {
      const snowModel: ISnowModel = await Convert(
        smlObjects,
        model,
        this.logger,
        Constants.DO_MAP_DATASETS_TO_DIMS
      );
      cortexConversionOutput.push(snowModel);
    }

    //TODO: Figure out what to do about the composite models
    // Composite models compilation logic requires the file

    for (const compositeModelFile of smlObjects.compositeModels) {
      
      const newFile = convertSMLObjectToYamlParsedFile(compositeModelFile);
      const allFiles = convertSMLObjectsToYamlParsedFiles(smlObjects.models);

      const fullCompositeModelFile: IYamlParsedFile<SMLObject> = convertCompositeModel(
        newFile,
        allFiles
      );

      const modelFromComposite = fullCompositeModelFile.data as SMLModel;
      const snowModel: ISnowModel = await Convert(
        smlObjects,
        modelFromComposite,
        this.logger,
        Constants.DO_MAP_DATASETS_TO_DIMS
      );
      cortexConversionOutput.push(snowModel);
    }

    return cortexConversionOutput;
  }
}

function convertSMLObjectToYamlParsedFile(compositeModelFile:SMLObject): IYamlParsedFile {
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

function convertSMLObjectsToYamlParsedFiles(compositeModelFiles: Array<SMLObject>): Array<IYamlParsedFile> {
  return compositeModelFiles.map((file) => convertSMLObjectToYamlParsedFile(file));
}
