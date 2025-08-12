import {
  SMLDimensionRelationType,
  SMLEmbeddedRelationship,
  SMLModel,
  SMLModelRelationship,
  SMLUnrelatedDimensionsHandling,
} from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { BimRelationship, BimRoot, BimTable } from "../bim-models/bim-model";
import { TableLists } from "../bim-models/types-and-interfaces";
import { datasetsInDim, dimFromDataset, getKeyColumn } from "./converter-utils";
import { lookupAttrUniqueName, makeUniqueName } from "./tools";

export class RelationshipConverter {
  private logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }

  createRelationships(
    bim: BimRoot,
    tableLists: TableLists,
    model: SMLModel,
    attrNameMap: Map<string, string[]>,
    result: SmlConverterResult,
  ) {
    if (bim.model.relationships) {
      // Model Relationships
      bim.model.relationships.forEach((bimRelationship) => {
        if (
          tableLists.factTables.find(
            (tbl) => tbl.name === bimRelationship.fromTable,
          )
        ) {
          if (
            !tableLists.unusedTables.has(bimRelationship.toTable) &&
            !tableLists.unusedTables.has(bimRelationship.fromTable)
          )
            this.convertRelationship(bimRelationship, model, attrNameMap);
        }
      });

      // Handle Dimensions
      tableLists.dimTables.forEach((bimDimTable) => {
        const dimRels = new Array<SMLEmbeddedRelationship>();
        bim.model.relationships.forEach((bimRelationship) => {
          if (
            bimDimTable.name === bimRelationship.fromTable &&
            !tableLists.unusedTables.has(bimRelationship.fromTable) &&
            !tableLists.unusedTables.has(bimRelationship.toTable)
          ) {
            dimRels.push(
              this.createEmbeddedRelationship(bimRelationship, result),
            );
          }
        });
        if (dimRels.length > 0)
          this.addRelationshipsToDim(bimDimTable.name, dimRels, result);
      });

      // If a table is used as both a fact and dim create a relationship between them
      for (const tbl of tableLists.factTables) {
        if (tableLists.dimTables.find((d) => d.name === tbl.name)) {
          this.createRelationshipSameTable(tbl, model, result, attrNameMap);
        }
      }
    }
  }
  convertRelationship(
    bimRelationship: BimRelationship,
    model: SMLModel,
    attrNameMap: Map<string, string[]>,
  ): void {
    const dataset_unique_name_from = makeUniqueName(
      `dataset.${bimRelationship.fromTable}`,
    );
    const dimension_unique_name_to = makeUniqueName(
      `dimension.${bimRelationship.toTable}`,
    );
    const relationship_unique_name = makeUniqueName(
      dataset_unique_name_from +
        "." +
        bimRelationship.fromColumn +
        "." +
        dimension_unique_name_to,
    );
    const level_unique_name =
      makeUniqueName(`dimension.${bimRelationship.toTable}.attr.`) +
      bimRelationship.toColumn;
    const lookup = lookupAttrUniqueName(
      attrNameMap,
      level_unique_name,
      true,
      this.logger,
    );

    const relationship = {
      unique_name: relationship_unique_name,
      from: {
        dataset: dataset_unique_name_from,
        join_columns: [bimRelationship.fromColumn],
      },
      to: {
        dimension: dimension_unique_name_to,
        level: lookup ?? level_unique_name,
      },
    } satisfies SMLModelRelationship;

    model.relationships.push(relationship);
  }
  createEmbeddedRelationship(
    bimRelationship: BimRelationship,
    result: SmlConverterResult,
  ): SMLEmbeddedRelationship {
    const dataset_unique_name_from = makeUniqueName(
      `dataset.${bimRelationship.fromTable}`,
    );
    const hierarchy_unique_name_from = this.hierNameFromColumn(
      result,
      bimRelationship.fromTable,
      bimRelationship.fromColumn,
    );
    const level_unique_name_from_subset = makeUniqueName(
      `dimension.${bimRelationship.fromTable}.attr.`,
    ); // Attribute name is appended later
    const dimension_unique_name_to = makeUniqueName(
      `dimension.${bimRelationship.toTable}`,
    );
    const level_unique_name_to = this.levelNameFromColumn(
      result,
      bimRelationship.toTable,
      bimRelationship.toColumn,
    );
    const relationship_unique_name = makeUniqueName(
      dataset_unique_name_from + "." + dimension_unique_name_to,
    );

    const dimRel: SMLEmbeddedRelationship = {
      unique_name: relationship_unique_name,
      from: {
        hierarchy: hierarchy_unique_name_from,
        level: level_unique_name_from_subset,
        dataset: dataset_unique_name_from,
        join_columns: [bimRelationship.fromColumn],
      },
      to: {
        dimension: dimension_unique_name_to,
        level: level_unique_name_to,
      },
      type: SMLDimensionRelationType.Embedded,
    };
    return dimRel;
  }
  addRelationshipsToDim(
    tblName: string,
    relationships: SMLEmbeddedRelationship[],
    result: SmlConverterResult,
  ) {
    const dimName = makeUniqueName(`dimension.${tblName}`);
    const dim = result.dimensions.find((d) => d.unique_name === dimName);
    if (dim) {
      const default_level_unique_name =
        dim.hierarchies[0].levels.at(-1)?.unique_name;
      if (default_level_unique_name) {
        if (relationships && relationships.length > 0) {
          relationships.forEach((r) => {
            r.from.level = default_level_unique_name;
          });
          dim.relationships = relationships;
        }
      }
    } else {
      this.logger.warn(
        `No dimension named '${dimName}' found on which to add embedded relationships`,
      );
    }
  }

  createRelationshipSameTable(
    bimTable: BimTable,
    model: SMLModel,
    result: SmlConverterResult,
    attrNameMap: Map<string, string[]>,
  ): void {
    const dataset_unique_name_from = makeUniqueName(`dataset.${bimTable.name}`);
    const dimension_unique_name_to = makeUniqueName(
      `dimension.${bimTable.name}`,
    );
    const relationship_unique_name = makeUniqueName(
      dataset_unique_name_from + "." + dimension_unique_name_to,
    );
    let keyCol = getKeyColumn(bimTable);
    if (!keyCol) {
      // Use lowest level of dimension
      const dim = result.dimensions.find(
        (dim) => dim.unique_name === dimension_unique_name_to,
      );
      if (dim) {
        const leaf =
          dim.hierarchies[0].levels[dim.hierarchies[0].levels.length - 1];
        if (leaf) {
          const attr = dim.level_attributes.find(
            (a) => a.unique_name === leaf.unique_name,
          );
          if (attr && "key_columns" in attr) keyCol = attr?.key_columns[0];
        }
      }
      if (!keyCol) {
        this.logger.warn(
          `No key/leaf column found on table '${bimTable.name}' so not creating relationship between fact and dimension on the same table`,
        );
        return;
      }
    }
    const level_unique_name =
      makeUniqueName(`${dimension_unique_name_to}.attr.`) + keyCol;

    const relationship: SMLModelRelationship = {
      unique_name: relationship_unique_name,
      from: {
        dataset: dataset_unique_name_from,
        join_columns: [keyCol],
      },
      to: {
        dimension: dimension_unique_name_to,
        level:
          lookupAttrUniqueName(
            attrNameMap,
            level_unique_name,
            true,
            this.logger,
          ) ?? level_unique_name,
      },
    };
    model.relationships.push(relationship);
  }

  // If measures exist on a table that is not on the left side of a join, add the relationship
  // to itself and update the measures to use unrelated dimensions handling: repeat
  addMissingRelationships(result: SmlConverterResult, model: SMLModel) {
    const leftDatasets = new Set<string>();
    const rightDatasets = new Map<string, string>();

    model.relationships?.forEach((rel) => {
      leftDatasets.add(rel.from.dataset);
      const dim: string = "dimension" in rel.to ? rel.to.dimension : "";
      if (dim) {
        datasetsInDim(result, dim)?.forEach((ds) => rightDatasets.set(ds, dim));
      }
    });
    // Add embedded dimensions
    result.dimensions?.forEach((dimension) => {
      dimension.relationships?.forEach((rel) => {
        const dim: string = "dimension" in rel.to ? rel.to.dimension : "";
        if (dim) {
          if ("dimension" in rel.to)
            datasetsInDim(result, dim)?.forEach((ds) =>
              rightDatasets.set(ds, dim),
            );
        }
      });
    });

    const datasetJoinsToCreate = new Set<string>();

    result.measures?.forEach((meas) => {
      if (!leftDatasets.has(meas.dataset) && rightDatasets.has(meas.dataset)) {
        meas.unrelated_dimensions_handling =
          SMLUnrelatedDimensionsHandling.Repeat;
        datasetJoinsToCreate.add(meas.dataset);
      }
    });

    if (datasetJoinsToCreate.size > 0) {
      datasetJoinsToCreate.forEach((ds) => {
        const dimension = dimFromDataset(result, ds);

        if (dimension) {
          const levelUniqueName =
            dimension.hierarchies[0].levels[
              dimension.hierarchies[0].levels.length - 1
            ].unique_name;
          const leafAttr = dimension.level_attributes.find(
            (la) => la.unique_name === levelUniqueName,
          );

          const relation = {
            unique_name: makeUniqueName(ds + "." + dimension.unique_name),
            from: {
              dataset: ds,
              join_columns:
                leafAttr && "key_columns" in leafAttr
                  ? leafAttr.key_columns
                  : [],
            },
            to: { dimension: dimension.unique_name, level: levelUniqueName },
          } satisfies SMLModelRelationship;

          model.relationships.push(relation);
        }
      });
    }
  }

  hierNameFromColumn(
    result: SmlConverterResult,
    tbl: string,
    col: string,
  ): string {
    const dimName = makeUniqueName(`dimension.${tbl}`);
    const dim = result.dimensions.find((d) => d.unique_name === dimName);
    if (!dim) {
      this.logger.warn(
        `Can't find dimension using bim table ${tbl} so can't find needed hierarchy`,
      );
      return "";
    }
    dim.hierarchies.forEach((h) =>
      h.levels.forEach((l) => {
        const la = dim.level_attributes.find(
          (la) => l.unique_name === la.unique_name,
        );
        if (la && "name_column" in la && la.name_column === col)
          return h.unique_name;
      }),
    );
    return dim.hierarchies[0].unique_name;
  }

  levelNameFromColumn(
    result: SmlConverterResult,
    tbl: string,
    col: string,
  ): string {
    const dimName = makeUniqueName(`dimension.${tbl}`);
    const dim = result.dimensions.find((d) => d.unique_name === dimName);
    if (!dim) {
      this.logger.warn(
        `Can't find dimension using bim table ${tbl} so can't find needed level attribute`,
      );
      return "";
    }
    dim.level_attributes.forEach((a) => {
      if (
        "dataset" in a &&
        a.dataset === makeUniqueName(`dataset.${tbl}`) &&
        a.name_column.toLowerCase() === col.toLowerCase()
      ) {
        return a.unique_name;
      }
    });
    return dim.hierarchies[0].levels[dim.hierarchies[0].levels.length - 1]
      .unique_name;
  }
}
