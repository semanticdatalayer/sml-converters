import {
  SMLDimensionRelationType,
  SMLEmbeddedRelationship,
  SMLModelRegularRelationship,
  SMLModelRelationship,
} from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import {
  SnowviewRelationship,
  SnowviewTable,
  TableLists,
} from "../SnowviewModel";
import { getColumnName, getDataset } from "./converter-util";

export class SnowviewRelationshipConverter {
  constructor(private readonly logger: Logger) {}

  convertRelationships(
    snowviewRelationships: SnowviewRelationship[],
    tableLists: TableLists,
    result: SmlConverterResult,
  ) {
    for (const rel of snowviewRelationships) {
      this.convertRelationship(rel, tableLists, result);
    }
  }

  /**
   * Converts a Snowview relationship to SML relationship format.
   * Handles two types of relationships:
   * 1. Fact table to dimension table relationships (added to model relationships)
   * 2. Dimension to dimension relationships (added as embedded relationships)
   *
   * @param snowviewRelationship - The source Snowview relationship to convert
   * @param tableLists - Object containing fact and dimension table lists
   * @param result - The target SML converter result object to be modified
   */
  convertRelationship(
    snowviewRelationship: SnowviewRelationship,
    tableLists: TableLists,
    result: SmlConverterResult,
  ) {
    const relationshipTo = snowviewRelationship.ref_table;
    const relationshipFrom = snowviewRelationship.table;
    const factTable = [...tableLists.factTables].find(
      (t) => t.name === relationshipFrom,
    );
    if (factTable) {
      // It's a relationship from a fact table to a dimension table
      // It will be added to the model relationships
      this.addRelationshipToModel(snowviewRelationship, result);
    } else {
      // It's a dimension to dimension relationship
      const dimTable = [...tableLists.dimTables].find(
        (t) => t.name === relationshipFrom,
      );
      if (dimTable) {
        const newRelationship: SMLEmbeddedRelationship = {
          unique_name: snowviewRelationship.name,
          from: {
            dataset: relationshipFrom,
            join_columns: snowviewRelationship.foreign_key,
            hierarchy: `${relationshipFrom}_dimension_default_hierarchy`,
            level: `${relationshipFrom}_level`,
          },
          to: {
            level: `${relationshipTo}_level`,
            dimension: `${relationshipTo}_dimension`,
          },
          type: SMLDimensionRelationType.Embedded,
        };
        // It is not snowflake, it's embedded
        const dimensionTo = result.dimensions.find(
          (d) => d.unique_name === `${relationshipFrom}_dimension`,
        );
        if (dimensionTo) {
          dimensionTo.relationships = dimensionTo.relationships ?? [];
          dimensionTo.relationships?.push(newRelationship);
        }

        // Add a relationship to the model as well for completeness
        this.addRelationshipToModel(snowviewRelationship, result);
      }
    }
  }

  /**
   * Adds a relationship to the model relationships list in the SML converter result.
   * @param snowviewRelationship The Snowview relationship to convert and add
   * @param result The SML converter result object to be modified
   */
  addRelationshipToModel(
    snowviewRelationship: SnowviewRelationship,
    result: SmlConverterResult,
  ) {
    const relationshipTo = snowviewRelationship.ref_table;
    const relationshipFrom = snowviewRelationship.table;
    const modelRelationship: SMLModelRegularRelationship = {
      unique_name: snowviewRelationship.name,
      from: {
        dataset: relationshipFrom,
        join_columns: snowviewRelationship.foreign_key,
      },
      to: {
        dimension: `${relationshipTo}_dimension`,
        level: `${relationshipTo}_level`,
      },
    };
    result.models[0].relationships?.push(modelRelationship);
  }

  /**
   * Add a secondary attribute to the time dimension and create a relationship from the given column to the time dimension
   * @param dimCol The dimension column
   * @param dataset The dataset name
   * @param result The SML converter result
   */
  addRelationshipToTimeDimension(
    dimCol: string,
    dataset: string,
    result: SmlConverterResult,
  ) {
    let realCol = dimCol;
    if (dimCol.includes(".")) {
      // It's table.column format, we only want the column
      const [tbl, col] = dimCol.split(".");
      realCol = col;
    }
    realCol = getColumnName(realCol, dataset, result, this.logger);
    dataset = getDataset(dataset, result, this.logger)!.unique_name;

    const newRelationship: SMLModelRelationship = {
      unique_name: `${dataset}_Date Dimension_${realCol}`, // dataset + "_" + "Date Dimension" + "_" + dim.name,
      from: {
        dataset: dataset,
        join_columns: [realCol],
      },
      to: {
        dimension: "Date Dimension",
        level: "DayMonth",
      },
      role_play: realCol + " {0}",
    };
    result.models[0].relationships.push(newRelationship);
  }

  /**
   * Adds self-referential relationships for each dimension table to the model
   * @param dimTables The set of dimension tables
   * @param result The SML converter result
   */
  addDimensionRelationshipsToModel(
    dimTables: Set<SnowviewTable>,
    result: SmlConverterResult,
  ) {
    for (const dimension of dimTables) {
      const fauxRelationship: SnowviewRelationship = {
        name: `${dimension.name}_to_self`,
        parent_entity: "",
        table: dimension.name,
        ref_table: dimension.name,
        foreign_key: dimension.primary_key,
        ref_key: [""],
      };
      this.addRelationshipToModel(fauxRelationship, result);
    }
  }
}
