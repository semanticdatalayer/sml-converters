import { SMLColumnDataType, SMLModel, SMLDatasetTypeGuard } from "sml-sdk";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import {
  fmtDimRef,
  isRegularRelationship,
  addToMapWithSet,
} from "./cortex-tools";
import {
  dimFromName,
  listAttributesInDim,
  addReferencedDims,
  addDimRels,
} from "./cortex-sml-processor";

/**
 * Gets all time-based columns from an SmlConverterResult, based on the column's dataType
 * @returns a set of all time columns along with their dataset (<dataset>.<column>)
 */
export function listTimeColumns(smlObjects: SmlConverterResult): Set<string> {
  const cols = new Set<string>();
  smlObjects.datasets.forEach((dataset) =>
    dataset.columns
      .filter(SMLDatasetTypeGuard.isSimpleColumn)
      .forEach((column) => {
        if (
          [
            SMLColumnDataType.DateTime,
            SMLColumnDataType.TimeStamp,
            SMLColumnDataType.Date,
          ].includes(column.data_type as SMLColumnDataType)
        ) {
          cols.add(dataset.unique_name + "." + column.name);
        }
      }),
  );
  return cols;
}

/**
 * Gets all number-based columns from an SmlConverterResult, based on the column's dataType
 * @returns a set of all number columns along with their dataset (<dataset>.<column>)
 */
export function listNumericColumns(
  smlObjects: SmlConverterResult,
): Set<string> {
  const cols = new Set<string>();
  smlObjects.datasets.forEach((dataset) =>
    dataset.columns
      .filter(SMLDatasetTypeGuard.isSimpleColumn)
      .forEach((column) => {
        if (
          [
            SMLColumnDataType.BigInt,
            SMLColumnDataType.Int,
            SMLColumnDataType.Decimal,
            SMLColumnDataType.Double,
            SMLColumnDataType.Float,
            SMLColumnDataType.Long,
            SMLColumnDataType.Number,
            SMLColumnDataType.Numeric,
            SMLColumnDataType.TinyInt,
          ].includes(column.data_type as SMLColumnDataType)
        ) {
          cols.add(dataset.unique_name + "." + column.name);
        }
      }),
  );
  return cols;
}

export function createMapDatasetsToDims(
  smlObjects: SmlConverterResult,
  models: Array<SMLModel>,
): Map<string, Set<string>> {
  const mapResult = new Map<string, Set<string>>();
  const usedDatasets = new Set<string>();
  const rolePlays = new Set<string>();

  models.forEach((smlModel) => {
    // List datasets used by measures in the model then iterate over them to build out the map
    smlObjects.measures.forEach((measure) => usedDatasets.add(measure.dataset));

    usedDatasets.forEach((dsName) => {
      rolePlays.clear();

      // List all dimensions referenced by the model and their references recursively
      if (smlModel.relationships) {
        smlModel.relationships.forEach((relationship) => {
          if (
            isRegularRelationship(relationship) &&
            relationship.from.dataset === dsName
          ) {
            const roleplay =
              "role_play" in relationship && relationship.role_play
                ? relationship.role_play
                : "";
            const dimRef = fmtDimRef(relationship, ""); // r.to.dimension;
            rolePlays.add(dimRef);
            addDimRels(
              smlObjects,
              dimFromName(smlObjects, dimRef),
              rolePlays,
              roleplay,
            );
          }
        });
      }

      addReferencedDims(smlObjects, rolePlays);
      rolePlays.forEach((rolePlay) =>
        addToMapWithSet(
          mapResult,
          dsName,
          listAttributesInDim(smlObjects, rolePlay),
        ),
      );
    });
  });
  return mapResult;
}
