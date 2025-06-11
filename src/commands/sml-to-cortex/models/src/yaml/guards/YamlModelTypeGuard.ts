import { IYamlDimensionRelationship } from "../IYamlDimension";
import { IYamlModelRegularRelationship, IYamlModelRelationship, IYamlModelSecurityRelationship } from "../IYamlModel";
import { modelOrphanRegularSchema, modelOrphanSecuritySchema } from "../schemas/orphanRelationship.schema";
import TypeGuardUtil from "./type-guard-util";

export default class YamlModelTypeGuard {
  static isSecurityRelation = (
    input: IYamlModelRelationship | IYamlDimensionRelationship | IYamlModelSecurityRelationship
  ): input is IYamlModelSecurityRelationship => {
    return TypeGuardUtil.hasProps(input.to, "row_security") && TypeGuardUtil.hasNoProps(input.to, "level");
  };

  static isRegularRelation = (
    input: IYamlModelRelationship | IYamlDimensionRelationship
  ): input is IYamlModelRegularRelationship => {
    return TypeGuardUtil.hasProps(input.to, "level") && TypeGuardUtil.hasNoProps(input.to, "row_security");
  };

  static isOrphanRelation = (input: IYamlModelRelationship): input is IYamlModelRelationship =>
    modelOrphanRegularSchema.safeParse(input).success || modelOrphanSecuritySchema.safeParse(input).success;
}
