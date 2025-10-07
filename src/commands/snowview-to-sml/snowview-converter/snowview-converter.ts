import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SnowflakeCon } from "../snowflake-connect";
import { SnowviewModel, SnowviewTable, TableLists } from "../SnowviewModel";

import { SnowviewTableConverter } from "./table-converter";

import * as fs from "fs";
import { SMLCatalog, SMLObjectType, SMLModel, SMLConnection } from "sml-sdk";
import { SnowviewConnectionConverter } from "./connection-converter";
import { SnowviewDimensionConverter } from "./dimension-converter";
import { SnowviewRelationshipConverter } from "./relationship-converter";
import { SnowviewMetricConverter } from "./metric-converter";
import { SnowviewFactConverter } from "./fact-converter";
import { DbtConstants } from "../../dbt-to-sml/dbt-converter/dbt-constants";
import { DWType } from "../../../shared/dw-types";
import { SmlResultWriter } from "../../../shared/sml-result-writer";
import { SmlFolderReader } from "../../../shared/sml-folder-reader";

export class SnowviewConverter {
  constructor(private readonly logger: Logger) {}

  // eslint-disable-next-line @typescript-eslint/require-await
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
      measTables: new Set<string>(),
      factTables: new Set<SnowviewTable>(),
      dimTables: new Set<SnowviewTable>(),
    };

    const connectionConverter = new SnowviewConnectionConverter(this.logger);
    connectionConverter.createConnections(asConnection, snowviewModel, result);

    const mainConnection: SMLConnection = {
      unique_name: "connection_AO",
      label: "connection_AO",
      object_type: SMLObjectType.Connection,
      as_connection: asConnection,
      database: "ATSCALE_SAMPLE_DATA",
      schema: "STELLA_DBT_TEST",
    };
    result.connections.push(mainConnection);

    result.datasets.push(
      DbtConstants.timeDataset(mainConnection, DWType.Snowflake, false),
    );

    const tableConverter = new SnowviewTableConverter(
      this.logger,
      snowflakeCon,
    );
    await tableConverter.mapTablesToSmlDatasets(snowviewModel.tables, result);


    tableConverter.identifyFactAndDimTables(snowviewModel, tableLists);

    const dimensionConverter = new SnowviewDimensionConverter(this.logger);

    result.dimensions.push(DbtConstants.timeDimension());

    dimensionConverter.createDimensions(tableLists, result);
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
    factConverter.convertFacts(snowviewModel, result);

    const metricConverter = new SnowviewMetricConverter(this.logger);
    metricConverter.convertMetrics(snowviewModel.metrics, result);

    return result;
  }
}
