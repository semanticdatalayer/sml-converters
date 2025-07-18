import { Logger } from "./logger";
import { serializeToSML, SMLObject, SMLObjectType } from "sml-sdk";
import fs from "fs/promises";
import path from "path";
import { SmlConverterResult } from "./sml-convert-result";
import { encodeFileName } from "./file-system-util";

const fileDefaultFolder: Record<SMLObjectType, string> = {
  [SMLObjectType.Catalog]: "/",
  [SMLObjectType.Model]: "models",
  [SMLObjectType.ModelSettings]: "/",
  [SMLObjectType.GlobalSettings]: "/",
  [SMLObjectType.Dimension]: "dimensions",
  [SMLObjectType.Dataset]: "datasets",
  [SMLObjectType.Metric]: "metrics",
  [SMLObjectType.MetricCalc]: "calculations",
  [SMLObjectType.Connection]: "connections",
  [SMLObjectType.RowSecurity]: "security",
  [SMLObjectType.CompositeModel]: "models",
};

export class SmlResultWriter {
  static create(logger: Logger) {
    return new SmlResultWriter(logger);
  }
  constructor(private readonly logger: Logger) {}

  static invalidCharRegEx = /[/\\:*?"<>|]/g;

  static encodedChar = "_";

  async persist(
    outputAbsolutePath: string,
    smlResult: SmlConverterResult,
  ): Promise<void> {
    //ensure output folder exists
    const dir = path.dirname(outputAbsolutePath);
    await fs.mkdir(dir, { recursive: true });

    //create the catalog file
    await this.persistObject(outputAbsolutePath, smlResult.catalog);

    await this.persistSmlCollections(
      outputAbsolutePath,
      smlResult.connections,
      smlResult.datasets,
      smlResult.dimensions,
      smlResult.measures,
      smlResult.measuresCalculated,
      smlResult.models,
    );
  }

  private encodeFileName(input: string): string {
    return encodeFileName(input)
  }

  private async persistObject(
    outputAbsolutePath: string,
    smlObject: SMLObject,
  ): Promise<void> {
    const subFolder = fileDefaultFolder[smlObject.object_type];
    const fileName =
      smlObject.object_type === SMLObjectType.Catalog
        ? "catalog.yml"
        : this.encodeFileName(`${smlObject.unique_name}.yml`);
    const filePath = path.join(outputAbsolutePath, subFolder, fileName);
    //TODO: check whether file already exists and suffix it
    const data = serializeToSML(smlObject);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data, `utf-8`);
  }

  private async persistSmlCollection(
    outputAbsolutePath: string,
    smlObjects: Array<SMLObject>,
  ) {
    //intentionally persist them one by one since a file name collision may occurs
    for (const smlObject of smlObjects) {
      await this.persistObject(outputAbsolutePath, smlObject);
    }
  }

  private async persistSmlCollections(
    outputAbsolutePath: string,
    ...collections: Array<Array<SMLObject>>
  ) {
    await Promise.all(
      collections.map((collection) =>
        this.persistSmlCollection(outputAbsolutePath, collection),
      ),
    );
  }
}
