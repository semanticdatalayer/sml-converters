import IYamlParsedFile from "models/src/IYamlParsedFile";
import YamlModelTypeGuard from "models/src/yaml/guards/YamlModelTypeGuard";
import { IYamlModel, IYamlModelRelationship } from "models/src/yaml/IYamlModel";
import { CloneUtil } from "utils/clone.util";

import { applyRelationshipErrors } from "../../utils/schema-validator-util";
import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { ISchemaObject, ISchemaValidatorWrapper } from "../SchemaValidatorWrapper/ISchemaValidatorWrapper";
import YamlObjectSchemaValidatorBase from "../YamlObjectSchemaValidatorBase";

export default class YamlModelSchemaValidator extends YamlObjectSchemaValidatorBase {
  constructor(
    protected readonly schemaValidator: ISchemaValidatorWrapper,
    protected readonly jsonSchema: ISchemaObject
  ) {
    super(schemaValidator, jsonSchema);
  }

  validateAML(parsedFile: IYamlParsedFile<IYamlModel>): IYamlObjectSchemaValidatorResponse {
    const { data: clonedFileData, ...clonedFile } = CloneUtil.deep(parsedFile);

    if (!Array.isArray(clonedFileData.relationships)) {
      return super.validateAML(parsedFile);
    }

    const orphanRelationships: IYamlModelRelationship[] = [];

    const filteredClonedRelationships: IYamlModelRelationship[] = [];

    clonedFileData.relationships.forEach((rel) => {
      if (YamlModelTypeGuard.isOrphanRelation(rel)) {
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
