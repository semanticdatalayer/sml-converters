import { IParsedFile } from "models/src/IParsedFile";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import TypeGuardUtil from "models/src/yaml/guards/type-guard-util";
import YamlObjectTypeGuard from "models/src/yaml/guards/yaml-object-type-guard";
import { IYamlDimension, IYamlDimensionRelationship } from "models/src/yaml/IYamlDimension";
import { IYamlModel, IYamlModelRelationship } from "models/src/yaml/IYamlModel";
import { noneEmptyString } from "models/src/yaml/schemas/orphanRelationship.schema";
import { CloneUtil } from "utils/clone.util";

import { globalDimensionsErrors } from "../CompilerValidator/Validators/GlobalValidators/YamlGlobalDimensionsValidator/YamlGlobalDimensionsValidator";
import { globalModelsErrors } from "../CompilerValidator/Validators/GlobalValidators/YamlGlobalModelsValidator/YamlGlobalModelsValidator";
import { IYamlObjectSchemaValidatorResponse } from "../YamlObjectSchemaValidator/IYamlObjectSchemaValidatorResponse";

export interface IVerifyRelationshipResultParams {
  result: IYamlObjectSchemaValidatorResponse;
  orphanRelationships?: (IYamlModelRelationship | IYamlDimensionRelationship)[];
}
export interface IApplyRelationshipErrorsParams extends IVerifyRelationshipResultParams {
  file: IParsedFile<IYamlDimension | IYamlModel>;
}

export const getOrphanError = (
  parsedFile: IYamlParsedFile<IYamlDimension | IYamlModel>,
  rel: IYamlModelRelationship | IYamlDimensionRelationship
) => {
  let orphanError: { foundKey: ObjectType[number]; object: string | string[] } = {
    foundKey: ObjectType.Dimension,
    object: "undefined unique name",
  };

  const ObjectTypeValues: string[] = Object.values(ObjectType).reduce(
    (prev, current) => {
      if (Object.keys(rel.from).includes(current)) {
        return [
          ...prev,
          current as ObjectType[number] extends infer U extends keyof (typeof rel)["to"]
            ? U
            : keyof (typeof rel)["from"],
        ];
      }
      if (Object.keys(rel.to).includes(current)) {
        return [
          ...prev,
          current as ObjectType[number] extends infer U extends keyof (typeof rel)["to"] ? U : keyof (typeof rel)["to"],
        ];
      }
      return prev;
    },
    [] as (ObjectType[number] extends infer U extends keyof (typeof rel)["to"] ? U : keyof (typeof rel)["from"])[]
  );
  let entityReference: string | string[] = "";

  for (const value of ObjectTypeValues) {
    const hasRelFrom = TypeGuardUtil.hasProps(rel.from, value);
    const hasRelTo = TypeGuardUtil.hasProps(rel.to, value);

    if (hasRelFrom) {
      const hasDefinedFrom = noneEmptyString.safeParse(rel.from[value as keyof typeof rel.from]).success;
      if (hasDefinedFrom) {
        entityReference = rel.from[value as keyof typeof rel.from];
        orphanError = { foundKey: value, object: entityReference };
      }
    }
    if (hasRelTo) {
      const hasDefinedTo = noneEmptyString.safeParse(rel.to[value as keyof typeof rel.to]).success;
      if (hasDefinedTo) {
        entityReference = rel.to[value as keyof typeof rel.to];
        orphanError = { foundKey: value, object: entityReference };
      }
    }
  }

  ObjectTypeValues.forEach((current) => {
    const hasRelFrom = TypeGuardUtil.hasProps(rel.from, current as ObjectType[number]);
    const hasNoFromEmptyString = noneEmptyString.safeParse(rel.from[current as keyof typeof rel.from]).success;

    if (hasRelFrom && hasNoFromEmptyString) {
      entityReference = rel.from[current as keyof typeof rel.from];
      orphanError = { foundKey: current, object: entityReference };
    }

    const hasRelTo = TypeGuardUtil.hasProps(rel.to, current as ObjectType[number]);
    const hasNoToEmptyString = noneEmptyString.safeParse(rel.to[current as keyof typeof rel.to]).success;

    if (hasRelTo && hasNoToEmptyString) {
      entityReference = rel.to[current as keyof typeof rel.to];
      orphanError = { foundKey: current, object: entityReference };
    }
  });
  if (YamlObjectTypeGuard.isModel(parsedFile.data)) {
    return globalModelsErrors.getRelationshipInModelError({
      object: Array.isArray(orphanError.object) ? orphanError.object[0] : orphanError.object,
      orphanType: orphanError.foundKey,
    });
  } else {
    return globalDimensionsErrors.getRelationshipInDimensionError({
      object: Array.isArray(orphanError.object) ? orphanError.object[0] : orphanError.object,
      orphanType: orphanError.foundKey,
    });
  }
};

export const applyRelationshipErrors: ({
  result,
  orphanRelationships,
  file,
}: IApplyRelationshipErrorsParams) => IYamlObjectSchemaValidatorResponse = ({
  result,
  orphanRelationships = [],
  file,
}) => {
  const clonedResult = CloneUtil.deep(result);

  const orphanErrors: string[] = orphanRelationships.map((rel) => getOrphanError(file, rel));

  const concatenatedErrors: string[] = [...clonedResult.errors, ...orphanErrors];

  return { errors: concatenatedErrors, isValid: concatenatedErrors.length === 0 };
};
