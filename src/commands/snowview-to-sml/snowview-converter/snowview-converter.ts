import { SMLCatalog, SMLModel, SMLObjectType } from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SnowflakeCon } from "../snowflake-connect";
import { SnowviewModel, SnowviewTable, TableLists } from "../SnowviewModel";
import { SnowviewConnectionConverter } from "./connection-converter";
import { SnowviewDatasetConverter } from "./dataset-converter";
import { SnowviewDimensionConverter } from "./dimension-converter";
import { SnowviewFactConverter } from "./fact-converter";
import { SnowviewMetricConverter } from "./metric-converter";
import { SnowviewRelationshipConverter } from "./relationship-converter";
import { timeDimension } from "./snowflake-time-dimension";
import { SnowviewTableConverter } from "./table-converter";

export class SnowviewConverter {
  constructor(private readonly logger: Logger) {}

  async convert(
    snowviewModel: SnowviewModel,
    snowflakeCon: SnowflakeCon,
    smlName: string,
    asConnection: string,
  ): Promise<SmlConverterResult> {
    const repoSettings: SMLCatalog = {
      object_type: SMLObjectType.Catalog,
      unique_name: smlName,
      version: 1.0,
      label: smlName,
      aggressive_agg_promotion: false,
      build_speculative_aggs: false,
    };

    const oneModel: SMLModel = {
      object_type: SMLObjectType.Model,
      label: smlName,
      unique_name: `model_${smlName}`,
      relationships: [],
      dimensions: [], // references
      metrics: [], // references
      partitions: [],
      perspectives: [], // references
      description: snowviewModel.comment,
    };

    const result: SmlConverterResult = {
      connections: [],
      datasets: [],
      dimensions: [],
      measures: [],
      measuresCalculated: [],
      models: [oneModel],
      catalog: repoSettings,
      rowSecurity: [],
      compositeModels: [],
    };

    const tableLists: TableLists = {
      factTables: new Set<SnowviewTable>(),
      dimTables: new Set<SnowviewTable>(),
    };

    const connectionConverter = new SnowviewConnectionConverter(this.logger);
    connectionConverter.createConnections(asConnection, snowviewModel, result);

    const tableConverter = new SnowviewTableConverter(
      this.logger,
      snowflakeCon,
    );
    await tableConverter.mapTablesToSmlDatasets(snowviewModel.tables, result);

    tableConverter.identifyFactAndDimTables(snowviewModel, tableLists);

    const dimensionConverter = new SnowviewDimensionConverter(this.logger);

    // Always add a time dimension
    // because most models will need it
    // and users can delete it if they don't want it
    result.dimensions.push(timeDimension());

    // Add a fake time dataset for the time dimension
    const datasetConverter = new SnowviewDatasetConverter(this.logger);
    datasetConverter.createTimeDataset(
      "dim_time_dataset",
      result,
      result.connections[0].unique_name,
    );

    // Create dimensions based on the identified dimension tables
    dimensionConverter.createDimensions(tableLists, result);
    // Convert the dimensions defined in the snowview model
    dimensionConverter.convertSnowviewDimensionsToSmlDimensions(
      snowviewModel.dimensions,
      result,
    );

    const relationshipConverter = new SnowviewRelationshipConverter(
      this.logger,
    );
    relationshipConverter.convertRelationships(
      snowviewModel.relationships,
      tableLists,
      result,
    );

    relationshipConverter.addDimensionRelationshipsToModel(
      tableLists.dimTables,
      result,
    );

    const factConverter = new SnowviewFactConverter(this.logger);
    factConverter.convertFacts(snowviewModel.facts, snowviewModel, result);

    const metricConverter = new SnowviewMetricConverter(this.logger);
    metricConverter.convertMetrics(snowviewModel.metrics, result);

    return result;
  }
}
