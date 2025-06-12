import {
  SMLDimensionalAttribute,
  SMLDimensionRegularRelationship,
  SMLDimensionRelationship,
  SMLEmbeddedRelationship,
  SMLLevelFromOneDataset,
  SMLLevelWithMultipleDatasets,
  SMLSecurityRelationship,
  SMLSnowflakeRelationship,
  SMLDimensionRelationType,
  SMLModelRelationship
} from "sml-sdk";
// import { IYamlModelRelationship } from "../IYamlModel";
import {
  dimensionEmbededOrphanSchema,
  dimensionSecurityOrphanSchema,
  dimensionSnowflakeOrphanSchema,
} from "../schemas/orphanRelationship.schema";
import TypeGuardUtil from "./type-guard-util";

export default class YamlDimensionTypeGuard {
  static isOrphanRelation(relationship: SMLDimensionRelationship): relationship is SMLDimensionRelationship {
    return (
      dimensionSnowflakeOrphanSchema.safeParse(relationship).success ||
      dimensionEmbededOrphanSchema.safeParse(relationship).success ||
      dimensionSecurityOrphanSchema.safeParse(relationship).success
    );
  }
  static isSnowflakeRelation(input: SMLDimensionRelationship): input is SMLSnowflakeRelationship {
    return input.type === SMLDimensionRelationType.Snowflake;
  }

  static isEmbeddedRelation(input: SMLDimensionRelationship): input is SMLEmbeddedRelationship {
    return input.type === SMLDimensionRelationType.Embedded;
  }

  static isSecurityRelation = (
    input: SMLDimensionRelationship | SMLModelRelationship | SMLSecurityRelationship
  ): input is SMLSecurityRelationship => {
    return TypeGuardUtil.hasProps(input.to, "row_security") && TypeGuardUtil.hasNoProps(input.to, "level");
  };

  static isLevelWithMultipleDatasets = (input: SMLDimensionalAttribute): input is SMLLevelWithMultipleDatasets => {
    return TypeGuardUtil.hasProps(input, "shared_degenerate_columns");
  };

  static isLevelFromOneDataset = (input: SMLDimensionalAttribute): input is SMLLevelFromOneDataset => {
    return !TypeGuardUtil.hasProps(input, "shared_degenerate_columns");
  };

  static isRegularRelation = (
    input: SMLDimensionRelationship | SMLModelRelationship | SMLSecurityRelationship
  ): input is SMLDimensionRegularRelationship => {
    return TypeGuardUtil.hasProps(input.to, "level") && TypeGuardUtil.hasNoProps(input.to, "row_security");
  };
}
