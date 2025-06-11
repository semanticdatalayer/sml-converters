import IYamlParsedFile from "models/src/IYamlParsedFile";
import YamlDimensionTypeGuard from "models/src/yaml/guards/YamlDimensionTypeGuard";
import { IYamlDimension, IYamlDimensionRelationship } from "models/src/yaml/IYamlDimension";
import { CloneUtil } from "utils/clone.util";

import { applyRelationshipErrors } from "../../utils/schema-validator-util";
import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { ISchemaObject, ISchemaValidatorWrapper } from "../SchemaValidatorWrapper/ISchemaValidatorWrapper";
import YamlObjectSchemaValidatorBase from "../YamlObjectSchemaValidatorBase";

export default class YamlDimensionSchemaValidator extends YamlObjectSchemaValidatorBase {
  constructor(
    protected readonly schemaValidator: ISchemaValidatorWrapper,
    protected readonly jsonSchema: ISchemaObject
  ) {
    super(schemaValidator, jsonSchema);
  }

  validateAML(parsedFile: IYamlParsedFile<IYamlDimension>): IYamlObjectSchemaValidatorResponse {
    const { data: clonedFileData, ...clonedFile } = CloneUtil.deep(parsedFile);

    if (!Array.isArray(clonedFileData.relationships)) {
      return super.validateAML(parsedFile);
    }

    const orphanRelationships: IYamlDimensionRelationship[] = [];

    const filteredClonedRelationships: IYamlDimensionRelationship[] = [];

    clonedFileData.relationships.forEach((rel) => {
      if (YamlDimensionTypeGuard.isOrphanRelation(rel)) {
        orphanRelationships.push(rel);
      } else {
        filteredClonedRelationships.push(rel);
      }
    });

    return applyRelationshipErrors({
      result: super.validateAML({
        ...clonedFile,
        data: { ...clonedFileData, relationships: filteredClonedRelationships },
      }),
      orphanRelationships,
      file: parsedFile,
    });
  }
}
