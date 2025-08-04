import { Logger } from "../../../shared/logger";

import { SMLCatalog, SMLModel, SMLObjectType } from "sml-sdk";

import { SmlConverterResult } from "../../../shared/sml-convert-result";

import { BimRoot, BimTable } from "../bim-models/bim-model";

import { Constants } from "../bim-models/constants";
import { orderProperties } from "../bim-models/order-properties";
import {
  AttributeMaps,
  MetricProps,
  TableLists,
} from "../bim-models/types-and-interfaces";
import { ConnectionConverter } from "./connection-converter";
import { checkForTimeDim } from "./converter-utils";
import { DatasetConverter } from "./dataset-converter";
import { DimensionConverter } from "./dimension-converter";
import { MeasureConverter } from "./measure-converter";
import { PerspectiveConverter } from "./perspective-converter";
import { RelationshipConverter } from "./relationship-converter";
import { TableConverter } from "./table-converter";
import { makeUniqueName } from "./tools";

export class BimToYamlConverter {
  constructor(readonly logger: Logger) {}

  async convert(
    bim: BimRoot,
    asConnection: string,
  ): Promise<SmlConverterResult> {
    const repoSettings: SMLCatalog = {
      object_type: SMLObjectType.Catalog,
      unique_name: makeUniqueName(bim.name),
      version: 1.0,
      label: bim.name,
      aggressive_agg_promotion: false, // TODO: made this false based on dbt converter
      build_speculative_aggs: false,
    };

    const oneModel: SMLModel = {
      object_type: SMLObjectType.Model,
      label: bim.name,
      unique_name: makeUniqueName(`model.${bim.name}`),
      relationships: [],
      dimensions: [], // references
      metrics: [], // references
      partitions: [],
      perspectives: [], // references
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

    const model = result.models[0];

    const attrMaps: AttributeMaps = {
      // This map contains 2 different mappings
      //   <friendly obj name lower case> -> [<type>, [table]]
      //   <old/qualified name lower case> -> [<new friendly name>]
      attrNameMap: new Map<string, string[]>(),
      metricLookup: new Map<string, MetricProps>(),
      metricLabels: new Map<string, number>(),
    };

    const tableLists: TableLists = {
      measTables: new Set<string>(),
      unusedTables: new Set<string>(),
      leftTables: new Set<string>(),
      rightTables: new Set<string>(),
      factTables: new Array<BimTable>(),
      dimTables: new Array<BimTable>(),
    };

    const tableConverter = new TableConverter(this.logger);
    tableConverter.listUnusedBimTables(bim, tableLists, this.logger);

    const measureConverter = new MeasureConverter(this.logger);
    measureConverter.measuresFromSimpleMeasures(bim, result, attrMaps, tableLists.unusedTables);

    const datasetConverter = new DatasetConverter(this.logger);
    await datasetConverter.createDatasetsAndMetrics(
      bim,
      result,
      tableLists,
      attrMaps,
    );

    tableConverter.populateTableLists(bim, tableLists); // leftTables, rightTables, measTables, factTables, dimTables, tableLists.unusedTables);

    const dimensionConverter = new DimensionConverter(this.logger);
    dimensionConverter.createDimensions(tableLists, bim, attrMaps, result);
    const relationshipConverter = new RelationshipConverter(this.logger);

    relationshipConverter.createRelationships(
      bim,
      tableLists,
      model,
      attrMaps.attrNameMap,
      result,
    );

    measureConverter.measuresFromColumns(bim, result, model, attrMaps, tableLists.unusedTables);

    relationshipConverter.addMissingRelationships(result, model);

    const perspectiveConverter = new PerspectiveConverter(this.logger);
    perspectiveConverter.createPerspectives(bim, result, attrMaps, tableLists);

    const connectionConverter = new ConnectionConverter(this.logger);
    connectionConverter.createConnections(
      asConnection || Constants.CONN_ID,
      bim,
      result,
    );

    orderProperties(result);

    // TODO: These calls are for investigations and debugging
    // listRealCalcs(result);
    // messageOnResult(result, tableLists);
    // messageOnResultOnly(result);

    checkForTimeDim(result, this.logger);

    return result;
  }
}
