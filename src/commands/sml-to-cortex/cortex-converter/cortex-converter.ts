import {
  SMLModel,
  SMLObject
} from "sml-sdk";

import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SmlFolderReader } from "../../../shared/sml-folder-reader"
import { Logger } from "../../../shared/logger";
import { convertCompositeModel } from "../../../shared/composite-model-util";
import { CortexConverterResult } from "../cortex-models/CortexConverterResult";
import { convertSmlModelToCortexModel } from "./snow-converter";
import { CortexModel } from "../cortex-models/CortexModel";

export default class CortexConverter {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async convertYamlFiles(rootFolder: string): Promise<CortexConverterResult> {

    const smlReader = new SmlFolderReader(this.logger);
    const smlConverterResult = await smlReader.readSmlObjects(rootFolder);
    const cortexConversionOutput: Array<CortexModel> = this.createCortexOutput(smlConverterResult);

    return { models: cortexConversionOutput };
  }

  createCortexOutput(smlObjects: SmlConverterResult, mapDatasetsToDims : boolean = false): CortexModel[] {
    const cortexConversionOutput = new Array<CortexModel>();

    for (const model of smlObjects.models) {
      const cortexModel: CortexModel = convertSmlModelToCortexModel(
        smlObjects,
        model,
        this.logger,
        mapDatasetsToDims
      );
      cortexConversionOutput.push(cortexModel);
    }

    for (const compositeModelFile of smlObjects.compositeModels) {
      
      const fullCompositeModelFile: SMLObject = convertCompositeModel(
        compositeModelFile,
        smlObjects.models
      );

      const modelFromComposite = fullCompositeModelFile as SMLModel;
      const cortexModel: CortexModel = convertSmlModelToCortexModel(
        smlObjects,
        modelFromComposite,
        this.logger,
        mapDatasetsToDims
      );
      cortexConversionOutput.push(cortexModel);
    }
    return cortexConversionOutput;
  }
}
