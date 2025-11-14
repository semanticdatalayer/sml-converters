import {
  SMLDataset,
  SMLDegenerateDimension,
  SMLDimension,
  SMLDimensionHierarchy,
  SMLDimensionLevel,
  SMLDimensionSecondaryAttribute,
  SMLDimensionType,
  SMLLevelFromOneDataset,
  SMLNormalDimension,
  SMLObjectType,
} from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SnowviewDimension, SnowviewTable, TableLists } from "../SnowviewModel";
import {
  getColumnName,
  getDataset,
  getExpressionInfo,
  isDateType,
  setDescription,
} from "./converter-util";
import { SnowviewDatasetConverter } from "./dataset-converter";
import { SnowviewRelationshipConverter } from "./relationship-converter";

export class SnowviewDimensionConverter {
  constructor(private readonly logger: Logger) {}

  createDimensions(
    tableLists: TableLists,
    result: SmlConverterResult,
  ): SMLDimension[] {
    return Array.from(tableLists.dimTables).map((dim) =>
      this.createDimension(dim, result),
    );
  }

  createDimension(
    snowviewTable: SnowviewTable,
    result: SmlConverterResult,
  ): SMLNormalDimension {
    const dimension_unique_name = `${snowviewTable.name}_dimension`;
    const hasTimeHierarchy = false; // TODO: Implement time hierarchy detection
    const label = snowviewTable.name;

    const defaultHierarchy = this.createDefaultHierarchy(
      dimension_unique_name,
      label,
    );
    const levelAttribute = this.addLevelAttribute(label, snowviewTable, result);

    const dimension: SMLNormalDimension = {
      object_type: SMLObjectType.Dimension,
      unique_name: dimension_unique_name,
      label: label,
      type: hasTimeHierarchy
        ? SMLDimensionType.Time
        : SMLDimensionType.Standard,
      description: snowviewTable.comment,
      hierarchies: [defaultHierarchy],
      level_attributes: [levelAttribute],
    };

    return dimension;
  }

  /**
   * Creates a default hierarchy for the given dimension
   * @param dimensionUniqueName The unique name of the dimension
   * @param dimensionLabel The label of the dimension
   * @returns A default hierarchy with one level
   */
  createDefaultHierarchy(
    dimensionUniqueName: string,
    dimensionLabel: string,
  ): SMLDimensionHierarchy {
    return {
      unique_name: `${dimensionUniqueName}_default_hierarchy`,
      label: `${dimensionLabel} Hierarchy`,
      levels: [
        {
          unique_name: `${dimensionLabel}_level`,
          secondary_attributes: [],
        } satisfies SMLDimensionLevel,
      ],
    };
  }

  /**
   * Creates a level attribute based on the Snowview table's primary key
   * @param dimensionLabel The label of the dimension
   * @param snowviewTable The Snowview table associated with the dimension
   * @param result The SML converter result
   * @returns A level attribute for the dimension
   */
  addLevelAttribute(
    dimensionLabel: string,
    snowviewTable: {
      name: string;
      primary_key: string[];
      comment?: string;
      synonyms?: string[];
    },
    result: SmlConverterResult,
  ): SMLLevelFromOneDataset {
    return {
      unique_name: `${dimensionLabel}_level`,
      dataset: snowviewTable.name,
      key_columns: snowviewTable.primary_key.map((pk) =>
        getColumnName(pk, snowviewTable.name, result, this.logger),
      ),
      label: dimensionLabel,
      description: setDescription(snowviewTable),
      is_hidden: true,
      name_column: getColumnName(
        snowviewTable.primary_key[0],
        snowviewTable.name,
        result,
        this.logger,
      ),
    } satisfies SMLLevelFromOneDataset;
  }

  convertSnowviewDimensionsToSmlDimensions(
    snowviewDims: SnowviewDimension[],
    result: SmlConverterResult,
  ) {
    for (const snowviewDim of snowviewDims) {
      this.convertSnowviewDimensionToSmlDimension(snowviewDim, result);
    }
  }

  /**
   * Converts a Snowview dimension into an either degenerate dimension or a secondary attribute
   * @param snowviewDim The Snowview dimension to convert
   * @param result The SML converter result
   */
  convertSnowviewDimensionToSmlDimension(
    snowviewDim: SnowviewDimension,
    result: SmlConverterResult,
  ) {
    const { smlDim, isSimpleColumnExpr, referenceOtherTable, smlTbl } =
      getExpressionInfo(snowviewDim, result);

    if (isDateType(snowviewDim.data_type, this.logger)) {
      const relationshipConverter = new SnowviewRelationshipConverter(
        this.logger,
      );
      const smlDataset = result.datasets.find(
        (ds) => ds.label === snowviewDim.table,
      );
      if (smlDataset) {
        const timeDimensionRelationship = relationshipConverter.addRelationshipToTimeDimension(
          snowviewDim.expression,
          smlDataset.unique_name,
          result,
        );
        result.models[0].relationships.push(timeDimensionRelationship);
      }
      return;
    }

    if (!smlDim) {
      if (smlTbl) {
        // Create degenerate dimension on the fact table
        const degenerateDimension = this.convertSnowviewDimensionToSmlDegenDim(
          snowviewDim,
          result,
          isSimpleColumnExpr,
          referenceOtherTable,
          smlTbl,
        );
        if (degenerateDimension) {
          result.dimensions.push(degenerateDimension);
          if (!result.models[0].dimensions) {
            result.models[0].dimensions = [];
          }
          result.models[0].dimensions.push(degenerateDimension.unique_name);
        }
        return;
      }
      this.logger.warn(
        `No corresponding SML dimension found for Snowview dimension: ${snowviewDim.name}`,
      );
      return;
    }

    const leafDimLevel =
      smlDim.hierarchies[0].levels[smlDim.hierarchies[0].levels.length - 1];
    // All dimensions created with this converter will only have one hierarchy and one level

    // If the expression is just a column name,
    // we can add that column as a secondary attribute to the dimension's lowest leaf heirarchy level
    if (isSimpleColumnExpr && !referenceOtherTable) {
      const secondaryAttr = this.convertSecondaryAttribute(
        snowviewDim,
        snowviewDim.table,
        snowviewDim.expression,
        result,
        leafDimLevel,
      );
      if (secondaryAttr) {
        leafDimLevel.secondary_attributes?.push(secondaryAttr);
      }
      // If the expression is a sql expression using a column in the correct table, we need to create a calculated column in the dataset first
    } else if (!isSimpleColumnExpr && !referenceOtherTable) {
      // Create calculated column in dataset
      const datasetConverter = new SnowviewDatasetConverter(this.logger);
      const smlDataset = result.datasets.find(
        (ds) => ds.label === snowviewDim.table,
      );
      if (smlDataset) {
        datasetConverter.addCalculatedColumn(snowviewDim, smlDataset, result);
      }
      // Add calculated column as secondary attribute to dimension
      const secondaryAttr = this.convertSecondaryAttribute(
        snowviewDim,
        snowviewDim.table,
        snowviewDim.name,
        result,
        leafDimLevel,
      );
      if (secondaryAttr) {
        leafDimLevel.secondary_attributes?.push(secondaryAttr);
      }
      // if it's a simple column, but references another table, we need to link that table
    } else if (isSimpleColumnExpr && referenceOtherTable) {
      // If the expression is a column from another table
      // Create a secondary attribute with the other dataset and its columns
      const [tbl, col] = snowviewDim.expression.split(".");
      const secondaryAttr = this.convertSecondaryAttribute(
        snowviewDim,
        tbl,
        col,
        result,
        leafDimLevel,
      );
      if (secondaryAttr) {
        leafDimLevel.secondary_attributes?.push(secondaryAttr);
      }
    } else {
      this.logger.warn(
        `Unable to convert Snowview dimension ${snowviewDim.name} with expression ${snowviewDim.expression}. Complex expressions referencing other tables are not supported.`,
      );
    }
  }

  /**
   * Converts a Snowview dimension to a secondary attribute in an SML dimension level.
   * If a secondary attribute already exists for the given dataset and column, the conversion is skipped.
   *
   * @param snowviewDim - The Snowview dimension to convert
   * @param dataset - The dataset name
   * @param keyColumn - The key column name
   * @param result - The SML converter result object containing conversion state and metadata
   * @param smlDimension - The SML dimension level to add the secondary attribute to
   */
  convertSecondaryAttribute(
    snowviewDim: SnowviewDimension,
    dataset: string,
    keyColumn: string,
    result: SmlConverterResult,
    smlDimension: SMLDimensionLevel,
  ) {
    const actualDataset = getDataset(dataset, result, this.logger)!.unique_name;
    const actualColumn = getColumnName(keyColumn, dataset, result, this.logger);

    // Check to see if another secondary attribute already exists for this dataset and column
    const existingSecondaryAttribute = smlDimension.secondary_attributes?.find(
      (attr) =>
        attr.dataset === actualDataset &&
        attr.key_columns?.length === 1 &&
        attr.key_columns[0] === actualColumn,
    );

    // No need to make another one if another already exists
    if (existingSecondaryAttribute) {
      this.logger.warn(
        `Unable to add ${snowviewDim.name} in dimension level ${smlDimension.unique_name}. Secondary attribute ${existingSecondaryAttribute.unique_name} already exists for dataset ${actualDataset} and column ${actualColumn}`,
      );
      return;
    }

    const secondary_attribute: SMLDimensionSecondaryAttribute = {
      unique_name: snowviewDim.name,
      dataset: actualDataset,
      key_columns: [actualColumn],
      label: snowviewDim.name,
      description: setDescription(snowviewDim),
      name_column: actualColumn,
    };
    if (snowviewDim.access_modifier === "PRIVATE") {
      secondary_attribute.is_hidden = true;
    }
    return secondary_attribute;
  }

  /**
   * Converts a Snowview dimension into an SML degenerate dimension.
   *
   * @param snowviewDim - The Snowview dimension to convert
   * @param result - The SML converter result for column name lookup
   * @param isSimpleColumnExpr - Indicates if the dimension expression is a simple column reference
   * @param referenceOtherTable - Indicates if the dimension references another table
   * @param smlDataset - The SML dataset context for the conversion
   * @returns The created degenerate dimension, or undefined if creation failed
   */
  convertSnowviewDimensionToSmlDegenDim(
    snowviewDim: SnowviewDimension,
    result: SmlConverterResult,
    isSimpleColumnExpr: boolean,
    referenceOtherTable: boolean,
    smlDataset: SMLDataset,
  ): SMLDegenerateDimension | undefined {
    if (isSimpleColumnExpr && !referenceOtherTable) {
      // Create a degenerate dimension on simple column
      return this.createDegenerateDimension(
        snowviewDim,
        snowviewDim.expression,
        result,
      );
    } else if (!isSimpleColumnExpr && !referenceOtherTable) {
      // Create calculated column in dataset
      const datasetConverter = new SnowviewDatasetConverter(this.logger);
      datasetConverter.addCalculatedColumn(snowviewDim, smlDataset, result);
      // Create degenerate dimension on calculated column
      return this.createDegenerateDimension(
        snowviewDim,
        snowviewDim.name,
        result,
      );
    } else if (isSimpleColumnExpr && referenceOtherTable) {
      // Create a degenerate dimension on the other table's column
      const [tbl, col] = snowviewDim.expression.split(".");
      return this.createDegenerateDimension(snowviewDim, col, result);
    } else {
      this.logger.warn(
        `Unable to convert Snowview dimension ${snowviewDim.name} with expression ${snowviewDim.expression}. Complex expressions referencing other tables are not supported.`,
      );
      return undefined;
    }
  }

  /**
   * Creates a degenerate dimension
   * @param snowviewDim The Snowview dimension
   * @param keyColumn The key column name
   * @param result The SML conversion result for column name lookup
   * @returns The created degenerate dimension
   */
  createDegenerateDimension(
    snowviewDim: SnowviewDimension,
    keyColumn: string,
    result: SmlConverterResult,
  ): SMLDegenerateDimension {
    const defaultHierarchy = this.createDefaultHierarchy(
      snowviewDim.name,
      snowviewDim.name,
    );
    const levelAttribute = this.addLevelAttribute(
      snowviewDim.name,
      {
        name: snowviewDim.table,
        primary_key: [keyColumn],
        comment: snowviewDim.comment,
        synonyms: snowviewDim.synonyms,
      },
      result,
    );

    return {
      unique_name: snowviewDim.name,
      is_degenerate: true,
      label: snowviewDim.name,
      object_type: SMLObjectType.Dimension,
      description: setDescription(snowviewDim),
      level_attributes: [levelAttribute],
      hierarchies: [defaultHierarchy],
    };
  }
}
