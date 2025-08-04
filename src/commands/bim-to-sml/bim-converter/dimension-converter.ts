import {
  SMLDimension,
  SMLDimensionHierarchy,
  SMLDimensionLevel,
  SMLDimensionSecondaryAttribute,
  SMLDimensionTimeUnit,
  SMLDimensionType,
  SMLLevelFromOneDataset,
  SMLNormalDimension,
  SMLObjectType,
} from "sml-sdk";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import {
  BimModel,
  BimRoot,
  BimTable,
  BimTableColumn,
  BimTableHierarchy,
  BimTableHierarchyLevel,
} from "../bim-models/bim-model";
import { dimLevels, listRelationshipColumns } from "./converter-utils";
import { makeUniqueName } from "./tools";
import {
  createUniqueAttrName,
  descriptionAsString,
  isHidden,
  lookupAttrUniqueName,
} from "./tools";
import {
  AttributeMaps,
  BimColumnDetail,
  TableLists,
} from "../bim-models/types-and-interfaces";
import { Logger } from "../../../shared/logger";

export class DimensionConverter {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  createDimensions(
    tableLists: TableLists,
    bim: BimRoot,
    attrMaps: AttributeMaps,
    result: SmlConverterResult,
  ) {
    tableLists.dimTables.forEach((bimDimTable) => {
      if (!tableLists.unusedTables.has(bimDimTable.name)) {
        this.convertDimension(
          bimDimTable,
          bim.model,
          attrMaps.attrNameMap,
          result,
        );
      }
    });
  }
  convertDimension(
    bimTable: BimTable,
    bimModel: BimModel,
    attrNameMap: Map<string, string[]>,
    result: SmlConverterResult,
  ): void {
    const dimension_unique_name = makeUniqueName(`dimension.${bimTable.name}`);
    const hasTimeHierarchy = bimTable.dataCategory?.localeCompare("Time") == 0;

    const dimension = {
      object_type: SMLObjectType.Dimension,
      unique_name: dimension_unique_name,
      label: bimTable.name,
      type: hasTimeHierarchy
        ? SMLDimensionType.Time
        : SMLDimensionType.Standard,
      description: descriptionAsString(bimTable.description),
      hierarchies: [], // TODO: use normal dimension instead of degenerate dimensions
      level_attributes: new Array<SMLLevelFromOneDataset>(), // TODO: it doesn't like when I just use []
    } satisfies SMLNormalDimension;

    const joinColumns: Array<string> = listRelationshipColumns(
      bimModel,
      bimTable,
    );
    if (joinColumns.length > 1) {
      this.logger.warn(
        `BIM table '${bimTable.name}' has relationships to it that point to more than one column. The resulting SML hierarchy levels in dimension '${dimension.unique_name}' should be reviewed to ensure they are accurate`,
      );
    }

    // Add Hierarchies: Need to have a default hierarchy for the Leaf Level if it's a dimension without a hierarchy
    if (!bimTable.hierarchies) {
      const defaultHierarchy: BimTableHierarchy = {
        name: `${bimTable.name} Hierarchy`,
        description: `${bimTable.name} Hierarchy`,
        isHidden: false,
        lineageTag: "",
        levels: [],
        changedProperties: [],
      };
      this.createDefaultHierarchy(
        bimTable,
        defaultHierarchy,
        dimension,
        attrNameMap,
        joinColumns,
      );
    } else {
      bimTable.hierarchies.forEach((bimHierarchy) => {
        this.convertHierarchy(
          bimTable,
          bimHierarchy,
          dimension,
          attrNameMap,
          joinColumns,
        );
      });
    }

    // Create list of columns used by levels and skip in creation of secondary attributes
    const levelCols = new Set<string>();
    dimension.level_attributes.forEach((la) => {
      if ("name_column" in la) levelCols.add(la.name_column);
    });
    // Add secondary attributes
    bimTable.columns.forEach((bimColumn) => {
      if (!levelCols.has(bimColumn.name) && !isHidden(bimColumn)) {
        this.convertSecondaryAttribute(
          bimTable,
          bimColumn,
          dimension,
          attrNameMap,
          joinColumns[0],
        );
      }
    });

    result.dimensions.push(dimension);
  }
  
  // Used when hierarchies are defined in the BIM file. Returns {str1: <leaf unique_name>, str2: ""}
  convertHierarchy(
    bimTable: BimTable,
    bimHierarchy: BimTableHierarchy,
    dimension: SMLDimension,
    attrNameMap: Map<string, string[]>,
    joinColumns: Array<string>,
  ) {
    const hierarchy_unique_name = makeUniqueName(`${bimHierarchy.name}`);
    const hierarchy: SMLDimensionHierarchy = {
      unique_name: hierarchy_unique_name,
      label: bimHierarchy.name,
      description: descriptionAsString(bimHierarchy.description),
      folder: bimHierarchy.displayFolder,
      levels: [],
    };

    // Create the levels
    if (bimHierarchy.levels != undefined) {
      bimHierarchy.levels.forEach((bimLevel) => {
        const bimColDetail: BimColumnDetail = {
          table: bimTable,
          column: undefined,
          label: bimLevel.name,
        };
        this.convertAndAddLevel(
          bimColDetail,
          bimLevel,
          dimension,
          hierarchy,
          false,
          attrNameMap,
        );
      });

      // For dimensions that have hierarchies, we need to make sure the leaf level is the same as the relationship join key
      // If it is not, we need to add another level and make it hidden
      this.addJoinLevels(
        bimTable,
        dimension,
        hierarchy,
        bimHierarchy,
        attrNameMap,
        joinColumns,
      );
    }
    dimension.hierarchies.push(hierarchy);
  }
  // Called when bim table doesn't define a hierarchy. Returns {str1: <leaf name>, str2: ""}

  createDefaultHierarchy(
    bimTable: BimTable,
    bimHierarchy: BimTableHierarchy,
    dimension: SMLDimension,
    attrNameMap: Map<string, string[]>,
    joinColumns: Array<string>,
  ) {
    const hierarchy_unique_name = makeUniqueName(`${bimHierarchy.name}`);

    const hierarchy: SMLDimensionHierarchy = {
      unique_name: hierarchy_unique_name,
      label: bimHierarchy.name,
      description: descriptionAsString(bimHierarchy.description),
      folder: bimHierarchy.displayFolder,
      levels: [],
    };

    joinColumns.forEach((col) => {
      const bimColumn = bimTable.columns.find((c) => c.name === col);
      if (bimColumn) {
        const defaultLevel: BimTableHierarchyLevel = {
          name: `${bimTable.name}.${col} Level`,
          description: `${bimTable.name}.${col} Level`,
          ordinal: 0,
          column: col,
          lineageTag: "",
        };

        const bimColDetail: BimColumnDetail = {
          table: bimTable,
          column: bimColumn,
          label: undefined,
        };
        this.convertAndAddLevel(
          bimColDetail,
          defaultLevel,
          dimension,
          hierarchy,
          false,
          attrNameMap,
        );
      } else {
        this.logger.warn(
          `Can't find column '${col}' on table '${bimTable.name}' used by relationship so can't add it as a level`,
        );
      }
    });
    dimension.hierarchies.push(hierarchy);
  }
  // Adds level to hierarchy along with level_attribute
  // Note: In BIM a hierarchy level can have a different name and column while in a BIM column there is only 1 value

  convertAndAddLevel(
    bimColumnDetail: BimColumnDetail,
    levelToAdd: BimTableHierarchyLevel, // Used for levels defined in hierarchies
    dimension: SMLDimension,
    hierarchy: SMLDimensionHierarchy,
    isHidden: boolean,
    attrNameMap: Map<string, string[]>,
  ): void {
    const existingLevel = dimension.level_attributes.find(
      (la) => "name_column" in la && la.name_column === levelToAdd.column,
    );
    let level_unique_name = levelToAdd.column;
    const default_level_unique_name =
      makeUniqueName(`dimension.${bimColumnDetail.table.name}.attr.`) +
      levelToAdd.column;
    if (existingLevel) {
      level_unique_name = existingLevel.unique_name;
    } else {
      const existingName = lookupAttrUniqueName(
        attrNameMap,
        default_level_unique_name,
        false,
        this.logger
      ); // levelToAdd.name
      if (existingName) {
        // Create new attribute for this level since it uses a different column from other attribute with same name
        level_unique_name = createUniqueAttrName(
          attrNameMap,
          levelToAdd.column,
          default_level_unique_name, // levelToAdd.name,
          "level attribute",
          bimColumnDetail.table.name,
          "",
          this.logger
        );
      } else {
        attrNameMap.set(level_unique_name.toLowerCase(), [
          "level attribute",
          bimColumnDetail.table.name,
        ]);
        attrNameMap.set(default_level_unique_name.toLowerCase(), [
          level_unique_name,
        ]);
      }
    }

    const level: SMLDimensionLevel = {
      unique_name: level_unique_name,
      secondary_attributes: [],
      is_hidden: isHidden,
    };
    hierarchy.levels.push(level);
    if (!existingLevel)
      this.addLevelAttribute(
        bimColumnDetail,
        levelToAdd,
        dimension,
        level_unique_name,
      );
  }

  // Creates attribute and adds to dimension.level_attributes
  addLevelAttribute(
    bimColumnDetail: BimColumnDetail,
    levelToAdd: BimTableHierarchyLevel,
    dimension: SMLDimension,
    level_unique_name: string,
  ): void {
    const dataset_unique_name = makeUniqueName(
      `dataset.${bimColumnDetail.table.name}`,
    );
    const colName = bimColumnDetail.column?.name ?? levelToAdd.column;

    dimension.level_attributes.push({
      unique_name: level_unique_name,
      dataset: dataset_unique_name,
      key_columns: [colName],
      label: bimColumnDetail.label ?? colName,
      description: descriptionAsString(
        bimColumnDetail.column?.description ?? levelToAdd.description,
      ),
      folder: bimColumnDetail.column?.displayFolder,
      is_hidden: bimColumnDetail.table.isHidden,
      time_unit:
        dimension.type && dimension.type === SMLDimensionType.Time
          ? this.convertTimeUnit(colName)
          : undefined,
      name_column: colName,
      is_unique_key: bimColumnDetail.column?.isKey,
    });
  }
  convertSecondaryAttribute(
    bimTable: BimTable,
    bimColumn: BimTableColumn,
    dimension: SMLDimension,
    attrNameMap: Map<string, string[]>,
    levelForSecondaryAttrs: string,
  ): void {
    if (bimColumn.summarizeBy && bimColumn.summarizeBy !== "none") return;

    const dataset_unique_name = makeUniqueName(`dataset.${bimTable.name}`);
    const default_attr_name =
      makeUniqueName(`dimension.${bimTable.name}.attr.`) + bimColumn.name;
    let attribute_unique_name = lookupAttrUniqueName(
      attrNameMap,
      default_attr_name,
      false,
      this.logger
    );
    if (!attribute_unique_name) {
      attribute_unique_name = createUniqueAttrName(
        attrNameMap,
        bimColumn.name,
        default_attr_name,
        "secondary attribute",
        bimTable.name,
        "",
        this.logger,
      );
    }

    // Add this attribute as a secondary attribute
    const secondary_attribute = {
      unique_name: attribute_unique_name,
      dataset: dataset_unique_name,
      key_columns: [bimColumn.name],
      label: bimColumn.name,
      description: descriptionAsString(bimColumn.description),
      folder: bimColumn.displayFolder,
      is_hidden: bimTable.isHidden,
      name_column: bimColumn.name,
      is_unique_key: bimColumn.isKey,
    } satisfies SMLDimensionSecondaryAttribute;

    // Find the first hierarchy
    if (
      dimension.hierarchies.length > 0 &&
      !dimension.hierarchies[0].levels.find(
        (l) => l.unique_name === attribute_unique_name,
      )
    ) {
      // Now find the level on which to create the secondary attributes, leaf by default
      let levelToUse;
      if (levelForSecondaryAttrs) {
        levelToUse = dimLevels(dimension).find(
          (level) => level.unique_name === levelForSecondaryAttrs,
        );
      } else {
        levelToUse = dimension.hierarchies[0].levels.slice(-1)[0];
      }

      if (levelToUse) {
        levelToUse.secondary_attributes?.push(secondary_attribute);
      } else {
        this.logger.warn(
          `Can't find level in dimension '${dimension.unique_name}' on which to create secondary attributes so '${attribute_unique_name}' will not be added`,
        );
      }
    }
  }

  // Since we don't know which join column should be the leaf (in cases where there are multiple relationships
  // to the table) we should use the first listed in bim table columns. We then add others as levels above it.
  // Returns the level on which secondary attributes should be created. If none, will use leaf.
  addJoinLevels(
    bimTable: BimTable,
    dimension: SMLDimension,
    hierarchy: SMLDimensionHierarchy,
    bimHierarchy: BimTableHierarchy,
    attrNameMap: Map<string, string[]>,
    joinColumns: Array<string>,
  ) {
    joinColumns.forEach((col) => {
      if (!bimHierarchy.levels.find((level) => level.column === col)) {
        const newLevel: BimTableHierarchyLevel = {
          name: `${bimTable.name}.${col} Level`,
          description: `${bimTable.name}.${col} Level`,
          ordinal: 0,
          column: col,
          lineageTag: "",
        };

        const bimColDetail: BimColumnDetail = {
          table: bimTable,
          column: undefined,
          label: undefined,
        };
        // Make sure this level is hidden
        this.convertAndAddLevel(
          bimColDetail,
          newLevel,
          dimension,
          hierarchy,
          true,
          attrNameMap,
        );
      }
    });
  }
  convertTimeUnit(levelName: string): SMLDimensionTimeUnit {
    if (levelName.toLowerCase().includes("day"))
      return SMLDimensionTimeUnit.Day;
    else if (levelName.toLowerCase().includes("date"))
      return SMLDimensionTimeUnit.Day;
    else if (levelName.toLowerCase().includes("week"))
      return SMLDimensionTimeUnit.Week;
    else if (
      levelName.toLowerCase().includes("month") ||
      levelName.toLowerCase().includes("mth")
    )
      return SMLDimensionTimeUnit.Month;
    else if (
      levelName.toLowerCase().includes("quarter") ||
      levelName.toLowerCase().includes("qtr")
    )
      return SMLDimensionTimeUnit.Quarter;
    else if (levelName.toLowerCase().includes("year"))
      return SMLDimensionTimeUnit.Year;
    else throw new Error("Unknown time field in field: " + levelName);
  }
}
