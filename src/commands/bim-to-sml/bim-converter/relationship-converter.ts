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
  // Track (fromDataset, toDimension) pairs for role-playing detection
  private modelRelationshipCounts: Map<string, number> = new Map();
  private embeddedRelationshipCounts: Map<string, number> = new Map();

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
            this.convertRelationship(bimRelationship, model, attrNameMap, result);
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
    result: SmlConverterResult,
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

    // Determine the target level, checking for key_columns count match
    let targetLevel = lookup ?? level_unique_name;
    const joinColumnsCount = 1; // We always join on single column from BIM

    const dim = result.dimensions.find(
      (d) => d.unique_name === dimension_unique_name_to,
    );
    if (dim) {
      const levelAttr = dim.level_attributes.find(
        (la) => la.unique_name === targetLevel,
      );
      if (levelAttr && "key_columns" in levelAttr) {
        const keyColumnsCount = levelAttr.key_columns.length;
        if (keyColumnsCount !== joinColumnsCount) {
          // Key columns mismatch - find a leaf level with single key_column
          const leafLevel = this.findSingleKeyLeafLevel(dim);
          if (leafLevel) {
            this.logger.debug(
              `Relationship to '${targetLevel}' has ${keyColumnsCount} key_columns but only ${joinColumnsCount} join_column. Using leaf level '${leafLevel}' instead.`,
            );
            targetLevel = leafLevel;
          } else {
            this.logger.warn(
              `Relationship from '${bimRelationship.fromTable}' to '${bimRelationship.toTable}' has mismatched key_columns (${keyColumnsCount}) vs join_columns (${joinColumnsCount}). No suitable leaf level found.`,
            );
          }
        }
      }
    }

    // Track role-playing: multiple relationships from same dataset to same dimension
    const relationshipKey = `${dataset_unique_name_from}|${dimension_unique_name_to}`;
    const count = this.modelRelationshipCounts.get(relationshipKey) ?? 0;
    this.modelRelationshipCounts.set(relationshipKey, count + 1);

    const relationship: {
      unique_name: string;
      from: { dataset: string; join_columns: string[] };
      to: { dimension: string; level: string };
      role_play?: string;
    } = {
      unique_name: relationship_unique_name,
      from: {
        dataset: dataset_unique_name_from,
        join_columns: [bimRelationship.fromColumn],
      },
      to: {
        dimension: dimension_unique_name_to,
        level: targetLevel,
      },
    };

    // Add role_play for second and subsequent relationships to same dimension
    if (count > 0) {
      relationship.role_play = this.buildRolePlayTemplate(
        bimRelationship.fromColumn,
        bimRelationship.toTable,
      );
    }

    model.relationships.push(relationship);
  }

  /**
   * Find a leaf level in the dimension hierarchy that has a single key_column.
   */
  private findSingleKeyLeafLevel(
    dim: SmlConverterResult["dimensions"][0],
  ): string | null {
    // Check leaf levels of each hierarchy (last level in each)
    for (const hier of dim.hierarchies) {
      const leafLevelName = hier.levels[hier.levels.length - 1]?.unique_name;
      if (leafLevelName) {
        const leafAttr = dim.level_attributes.find(
          (la) => la.unique_name === leafLevelName,
        );
        if (
          leafAttr &&
          "key_columns" in leafAttr &&
          leafAttr.key_columns.length === 1
        ) {
          return leafLevelName;
        }
      }
    }
    return null;
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

    // Track role-playing: multiple relationships from same dataset to same dimension
    const relationshipKey = `${dataset_unique_name_from}|${dimension_unique_name_to}`;
    const count = this.embeddedRelationshipCounts.get(relationshipKey) ?? 0;
    this.embeddedRelationshipCounts.set(relationshipKey, count + 1);

    // Include join column in unique_name for uniqueness
    const relationship_unique_name = makeUniqueName(
      dataset_unique_name_from +
        "." +
        bimRelationship.fromColumn +
        "." +
        dimension_unique_name_to,
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

    // Add role_play for second and subsequent relationships to same dimension
    if (count > 0) {
      dimRel.role_play = this.buildRolePlayTemplate(
        bimRelationship.fromColumn,
        bimRelationship.toTable,
      );
    }

    return dimRel;
  }

  /**
   * Build role_play template string with {0} placeholder.
   * Strips DATE suffix when target is a date/calendar dimension.
   */
  private buildRolePlayTemplate(fromColumn: string, toTable: string): string {
    let rolePrefix = fromColumn;

    // If targeting a date/calendar dimension, strip DATE suffix from column name
    const toTableLower = toTable.toLowerCase();
    if (
      toTableLower.includes("date") ||
      toTableLower.includes("calendar") ||
      toTableLower.includes("time")
    ) {
      rolePrefix = rolePrefix
        .replace(/_DATE$/i, "")
        .replace(/DATE$/i, "")
        .replace(/_DT$/i, "")
        .replace(/DT$/i, "");
    }

    // Clean up trailing underscores/spaces
    rolePrefix = rolePrefix.replace(/_+$/, "").replace(/\s+$/, "");

    return `${rolePrefix} {0}`;
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
