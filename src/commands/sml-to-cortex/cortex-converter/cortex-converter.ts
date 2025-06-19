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

import { ICortexConverterResult } from "./ICortexConverter";
import { Convert } from "./snow-converter";
import { ISnowModel } from "./snow-model";

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

  async convertYamlFiles(rootFolder: string): Promise<ICortexConverterResult> {

    const smlReader = new SmlFolderReader(this.logger);
    const smlConverterResult = await smlReader.readSmlObjects(rootFolder);
    const cortexConversionOutput: Array<ISnowModel> = await this.createCortexOutput(smlConverterResult);

    return { filesOutput: cortexConversionOutput };
  }

  async createCortexOutput(smlObjects: SmlConverterResult): Promise<ISnowModel[]> {
    const cortexConversionOutput = new Array<ISnowModel>();

    for (const model of smlObjects.models) {
      const snowModel: ISnowModel = await Convert(
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
      const snowModel: ISnowModel = Convert(
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

