import {
  SMLModel,
  SMLObject
} from "sml-sdk";

import {
  SmlConverterResult,
} from "../../../shared/sml-convert-result";

import {
  SmlFolderReader
} from "../../../shared/sml-folder-reader"

import { Logger } from "../../../shared/logger";

import { convertCompositeModel } from "../../../shared/composite-model-util";

import { CortexConverterResult } from "../cortex-models/CortexConverterResult";
import { Convert } from "./snow-converter";
import { CortexModel } from "../cortex-models/CortexModel";

export const Constants = {
  DO_MAP_DATASETS_TO_DIMS: false,
  PRINT_MESSAGES: true,
  FILTER_VALUES: ["cs_list_price", "cs list price"],
};

export default class CortexConverter {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async convertYamlFiles(rootFolder: string): Promise<CortexConverterResult> {

    const smlReader = new SmlFolderReader(this.logger);
    const smlConverterResult = await smlReader.readSmlObjects(rootFolder);
    const cortexConversionOutput: Array<CortexModel> = await this.createCortexOutput(smlConverterResult);

    return { models: cortexConversionOutput };
  }

  async createCortexOutput(smlObjects: SmlConverterResult): Promise<CortexModel[]> {
    const cortexConversionOutput = new Array<CortexModel>();

    for (const model of smlObjects.models) {
      const snowModel: CortexModel = await Convert(
        smlObjects,
        model,
        this.logger,
        Constants.DO_MAP_DATASETS_TO_DIMS
      );
      cortexConversionOutput.push(snowModel);
    }

    for (const compositeModelFile of smlObjects.compositeModels) {
      
      const fullCompositeModelFile: SMLObject = convertCompositeModel(
        compositeModelFile,
        smlObjects.models
      );

      const modelFromComposite = fullCompositeModelFile as SMLModel;
      const snowModel: CortexModel = Convert(
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

