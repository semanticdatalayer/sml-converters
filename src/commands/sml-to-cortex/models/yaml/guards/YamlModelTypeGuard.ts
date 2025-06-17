import { 
  SMLDimensionRelationship,
  SMLModelRegularRelationship,
  SMLModelRelationship,
  SMLModelSecurityRelationship,
} from "sml-sdk";
// import { IYamlModelRegularRelationship, IYamlModelRelationship, IYamlModelSecurityRelationship } from "../IYamlModel";
import { modelOrphanRegularSchema, modelOrphanSecuritySchema } from "../schemas/orphanRelationship.schema";
import TypeGuardUtil from "./type-guard-util";

export default class YamlModelTypeGuard {
  static isSecurityRelation = (
    input: SMLModelRelationship | SMLDimensionRelationship | SMLModelSecurityRelationship
  ): input is SMLModelSecurityRelationship => {
    return TypeGuardUtil.hasProps(input.to, "row_security") && TypeGuardUtil.hasNoProps(input.to, "level");
  };

  static isRegularRelation = (
    input: SMLModelRelationship | SMLDimensionRelationship
  ): input is SMLModelRegularRelationship => {
    return TypeGuardUtil.hasProps(input.to, "level") && TypeGuardUtil.hasNoProps(input.to, "row_security");
  };

  static isOrphanRelation = (input: SMLModelRelationship): input is SMLModelRelationship =>
    modelOrphanRegularSchema.safeParse(input).success || modelOrphanSecuritySchema.safeParse(input).success;
}
