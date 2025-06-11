import {
  IDimensionalAttribute,
  IYamlDimensionRegularRelationship,
  IYamlDimensionRelationship,
  IYamlEmbeddedRelationship,
  IYamlLevelFromOneDataset,
  IYamlLevelWithMultipleDatasets,
  IYamlSecurityRelationship,
  IYamlSnowflakeRelationship,
  YamlDimensionRelationType,
} from "../IYamlDimension";
import { IYamlModelRelationship } from "../IYamlModel";
import {
  dimensionEmbededOrphanSchema,
  dimensionSecurityOrphanSchema,
  dimensionSnowflakeOrphanSchema,
} from "../schemas/orphanRelationship.schema";
import TypeGuardUtil from "./type-guard-util";

export default class YamlDimensionTypeGuard {
  static isOrphanRelation(relationship: IYamlDimensionRelationship): relationship is IYamlDimensionRelationship {
    return (
      dimensionSnowflakeOrphanSchema.safeParse(relationship).success ||
      dimensionEmbededOrphanSchema.safeParse(relationship).success ||
      dimensionSecurityOrphanSchema.safeParse(relationship).success
    );
  }
  static isSnowflakeRelation(input: IYamlDimensionRelationship): input is IYamlSnowflakeRelationship {
    return input.type === YamlDimensionRelationType.Snowflake;
  }

  static isEmbeddedRelation(input: IYamlDimensionRelationship): input is IYamlEmbeddedRelationship {
    return input.type === YamlDimensionRelationType.Embedded;
  }

  static isSecurityRelation = (
    input: IYamlDimensionRelationship | IYamlModelRelationship | IYamlSecurityRelationship
  ): input is IYamlSecurityRelationship => {
    return TypeGuardUtil.hasProps(input.to, "row_security") && TypeGuardUtil.hasNoProps(input.to, "level");
  };

  static isLevelWithMultipleDatasets = (input: IDimensionalAttribute): input is IYamlLevelWithMultipleDatasets => {
    return TypeGuardUtil.hasProps(input, "shared_degenerate_columns");
  };

  static isLevelFromOneDataset = (input: IDimensionalAttribute): input is IYamlLevelFromOneDataset => {
    return !TypeGuardUtil.hasProps(input, "shared_degenerate_columns");
  };

  static isRegularRelation = (
    input: IYamlDimensionRelationship | IYamlModelRelationship | IYamlSecurityRelationship
  ): input is IYamlDimensionRegularRelationship => {
    return TypeGuardUtil.hasProps(input.to, "level") && TypeGuardUtil.hasNoProps(input.to, "row_security");
  };
}
