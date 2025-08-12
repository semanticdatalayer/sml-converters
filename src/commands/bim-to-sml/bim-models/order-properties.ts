import { SmlConverterResult } from "../../../shared/sml-convert-result";

/**
 * Reorders properties in the SML converter Object to follow a standardized property sequence
 * Used for display purposes
 *
 * @param result SMLConverter to be modified
 */
export function orderProperties(result: SmlConverterResult) {
  orderSettings(result);
  orderModels(result);
  orderRelationships(result);
  orderDimensions(result);
  orderDatasets(result);
  orderMetrics(result);
  orderCalculations(result);
  orderConnections(result);
}

function orderSettings(result: SmlConverterResult) {
  const settingsObjectOrder = {
    unique_name: null,
    object_type: null,
    label: null,
    version: null,
    aggressive_agg_promotion: null,
    build_speculative_aggs: null,
  };
  result.catalog = Object.assign(settingsObjectOrder, result.catalog);
}

function orderModels(result: SmlConverterResult) {
  for (let i = 0; i < result.models.length; i++) {
    const modelObjectOrder = {
      unique_name: null,
      object_type: null,
      label: null,
      relationships: null,
      metrics: null,
      dimensions: null,
      partitions: null,
      perspectives: null,
    };
    result.models[i] = Object.assign(modelObjectOrder, result.models[i]);
    if (
      !result.models[i].dimensions ||
      result.models[i].dimensions?.length == 0
    )
      result.models[i].dimensions = undefined;
    if (
      !result.models[i].partitions ||
      result.models[i].partitions?.length == 0
    )
      result.models[i].partitions = undefined;
    if (
      !result.models[i].perspectives ||
      result.models[i].perspectives?.length == 0
    )
      result.models[i].perspectives = undefined;
  }
}

function orderRelationships(result: SmlConverterResult) {
  for (let ri = 0; ri < result.models[0].relationships.length; ri++) {
    const rel = result.models[0].relationships[ri];
    const relationshipObjectOrder = {
      unique_name: null,
      from: null,
      to: null,
    };
    result.models[0].relationships[ri] = Object.assign(
      relationshipObjectOrder,
      rel,
    );
    if (result.models[0].relationships[ri].type)
      result.models[0].relationships[ri].type = undefined;
  }
}

function orderDimensions(result: SmlConverterResult) {
  for (let di = 0; di < result.dimensions.length; di++) {
    const dim = result.dimensions[di];
    const dimObjectOrder = {
      unique_name: null,
      object_type: null,
      label: null,
      description: null,
      type: null,
      relationships: null,
      hierarchies: null,
      level_attributes: null,
    };
    result.dimensions[di] = Object.assign(dimObjectOrder, dim);

    // Dimension relationships
    if (!dim.relationships || dim.relationships.length == 0) {
      result.dimensions[di].relationships = undefined;
    } else {
      for (let ri = 0; ri < dim.relationships.length; ri++) {
        const rel = result.models[0].relationships[ri];
        const relationshipObjectOrder = {
          unique_name: null,
          from: null,
          to: null,
        };
        result.models[0].relationships[ri] = Object.assign(
          relationshipObjectOrder,
          rel,
        );
      }
    }

    // Hierarchies
    for (let hi = 0; hi < result.dimensions[di].hierarchies.length; hi++) {
      const hier = dim.hierarchies[hi];
      const hierObjectOrder = {
        unique_name: null,
        label: null,
        description: null,
        folder: null,
        levels: null,
      };
      dim.hierarchies[hi] = Object.assign(hierObjectOrder, hier);

      // Levels
      for (let li = 0; li < hier.levels.length; li++) {
        const level = hier.levels[li];
        const levelObjectOrder = {
          unique_name: null,
          is_hidden: null,
          secondary_attributes: null,
        };
        hier.levels[li] = Object.assign(levelObjectOrder, level);
        if (!level.is_hidden) hier.levels[li].is_hidden = undefined;
        if (
          !level.secondary_attributes ||
          level.secondary_attributes.length == 0
        )
          hier.levels[li].secondary_attributes = undefined;

        // Secondary attributes
        const attributes = level.secondary_attributes;
        if (attributes) {
          for (let si = 0; si < attributes.length; si++) {
            const secondaryObjectOrder = {
              unique_name: null,
              label: null,
              description: null,
              folder: null,
              dataset: null,
              name_column: null,
              key_columns: null,
              contains_unique_names: null,
            };
            attributes[si] = Object.assign(
              secondaryObjectOrder,
              attributes[si],
            );
            if (!attributes[si].contains_unique_names)
              attributes[si].contains_unique_names = undefined;
          }
        }
      }
    }

    // Level attributes
    for (let la = 0; la < dim.level_attributes.length; la++) {
      const levelAttrObjectOrder = {
        unique_name: null,
        label: null,
        description: null,
        folder: null,
        contains_unique_names: null,
        time_unit: null,
        dataset: null,
        name_column: null,
        key_columns: null,
      };
      dim.level_attributes[la] = Object.assign(
        levelAttrObjectOrder,
        dim.level_attributes[la],
      );
      if (!dim.level_attributes[la].contains_unique_names)
        dim.level_attributes[la].contains_unique_names = undefined;
    }
  }
}

function orderDatasets(result: SmlConverterResult) {
  for (let di = 0; di < result.datasets.length; di++) {
    const ds = result.datasets[di];

    // Columns
    for (let ci = 0; ci < ds.columns.length; ci++) {
      const col = ds.columns[ci];
      const columnObjectOrder = {
        name: null,
        data_type: null,
      };
      ds.columns[ci] = Object.assign(columnObjectOrder, col);
    }

    const datasetObjectOrder = {
      unique_name: null,
      object_type: null,
      label: null,
      description: null,
      connection_id: null,
      table: null,
      columns: null,
      sql: null,
    };
    result.datasets[di] = Object.assign(datasetObjectOrder, ds);
  }
}

function orderMetrics(result: SmlConverterResult) {
  for (let ms = 0; ms < result.measures.length; ms++) {
    const metric = result.measures[ms];
    const metricObjectOrder = {
      unique_name: null,
      object_type: null,
      label: null,
      // 'type': null,
      description: null,
      folder: null,
      format: null,
      dataset: null,
      column: null,
      calculation_method: null,
      // 'expression': null,
    };
    result.measures[ms] = Object.assign(metricObjectOrder, metric);
    if (!metric.description) result.measures[ms].description = undefined;
    if (!metric.folder) result.measures[ms].folder = undefined;
    if (!metric.format) result.measures[ms].format = undefined;
  }
}

function orderCalculations(result: SmlConverterResult) {
  for (let ca = 0; ca < result.measuresCalculated.length; ca++) {
    const calc = result.measuresCalculated[ca];
    const calcObjectOrder = {
      unique_name: null,
      object_type: null,
      label: null,
      description: null,
      folder: null,
      format: null,
      expression: null,
    };
    result.measuresCalculated[ca] = Object.assign(calcObjectOrder, calc);
    if (!calc.description)
      result.measuresCalculated[ca].description = undefined;
    if (!calc.folder) result.measuresCalculated[ca].folder = undefined;
    if (!calc.format) result.measuresCalculated[ca].format = undefined;
  }
}

function orderConnections(result: SmlConverterResult) {
  for (let cn = 0; cn < result.connections.length; cn++) {
    const connectionObjectOrder = {
      unique_name: null,
      object_type: null,
      label: null,
      as_connection: null,
      database: null,
      schema: null,
    };
    result.connections[cn] = Object.assign(
      connectionObjectOrder,
      result.connections[cn],
    );
  }
}
