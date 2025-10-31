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

    // const tableLists: TableLists = {
    //   factTables: new Set<SnowviewTable>(),
    //   dimTables: new Set<SnowviewTable>(),
    // };

    const connectionConverter = new SnowviewConnectionConverter(this.logger);
    result.connections = connectionConverter.createConnections(
      asConnection,
      snowviewModel,
    );

    const tableConverter = new SnowviewTableConverter(
      this.logger,
      snowflakeCon,
    );
    result.datasets = await tableConverter.mapTablesToSmlDatasets(
      snowviewModel.tables,
      result.connections,
    );

    const tableLists = tableConverter.identifyFactAndDimTables(snowviewModel);

    const dimensionConverter = new SnowviewDimensionConverter(this.logger);

    // Always add a time dimension
    // because most models will need it
    // and users can delete it if they don't want it
    result.dimensions.push(timeDimension());

    // Add a fake time dataset for the time dimension
    const datasetConverter = new SnowviewDatasetConverter(this.logger);
    const timeDataset = datasetConverter.createTimeDataset(
      "dim_time_dataset",
      result.connections[0].unique_name,
    );
    result.datasets.push(timeDataset);

    // Create dimensions based on the identified dimension tables
    const dimensions = dimensionConverter.createDimensions(tableLists, result);
    result.dimensions.push(...dimensions);
    // if (!result.models[0].dimensions) {
    //   result.models[0].dimensions = [];
    // }
    // result.models[0].dimensions.push(...dimensions.map((dim) => dim.unique_name));
    // Convert the dimensions defined in the snowview model

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

    dimensionConverter.convertSnowviewDimensionsToSmlDimensions(
      snowviewModel.dimensions,
      result,
    );

    const factConverter = new SnowviewFactConverter(this.logger);
    factConverter.convertFacts(snowviewModel.facts, snowviewModel, result);

    const metricConverter = new SnowviewMetricConverter(this.logger);
    metricConverter.convertMetrics(snowviewModel.metrics, result);

    return result;
  }
}
