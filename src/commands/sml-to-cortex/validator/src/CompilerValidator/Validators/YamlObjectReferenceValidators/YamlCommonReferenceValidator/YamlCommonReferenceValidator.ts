import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import YamlObjectTypeGuard from "models/src/yaml/guards/yaml-object-type-guard";
import YamlDimensionTypeGuard from "models/src/yaml/guards/YamlDimensionTypeGuard";
import YamlModelTypeGuard from "models/src/yaml/guards/YamlModelTypeGuard";
import { IYamlDataset } from "models/src/yaml/IYamlDataset";
import {
  IYamlDimension,
  IYamlDimensionRegularRelationship,
  IYamlDimensionRelationship,
  IYamlEmbeddedRelationship,
  IYamlLevelFromOneDataset,
  YamlDimensionRelationType,
} from "models/src/yaml/IYamlDimension";
import {
  IYamlAttributeReference,
  IYamlModel,
  IYamlModelAggregate,
  IYamlModelDrillThrough,
  IYamlModelRelationship,
} from "models/src/yaml/IYamlModel";
import { byUniqueName } from "utils/find/find.util";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import IYamlCommonReferenceValidator from "./IYamlCommonReferenceValidator";

export const yamlCommonReferenceMessages = {
  referenceObjectNotExist: (referencedObjectType: string, referencedUniqueName: string): string =>
    `${referencedObjectType} "${referencedUniqueName}" does not exist`,
  incorrectReference: (referencedObjectType: string, referencedUniqueName: string, objectType: string): string =>
    `Incorrect ${referencedObjectType} reference. ${referencedObjectType} "${referencedUniqueName}" points to ${objectType}`,
  detachedRelationships: (uniqueName: string, objectType: string): string =>
    `Relationship in ${uniqueName} has detached ${objectType} and will be skipped for the compilation`,
  invalidDatasetRelationship: (uniqueName: string, relativePath: string, joinColumn: string[]): string =>
    `Invalid relationship in Dataset ${uniqueName} located in ${relativePath}. One or more connection columns are missing: ${joinColumn}`,
  invalidDimensionRelationship: (uniqueName: string, relativePath: string, level: string): string =>
    `Invalid relationship. The dimension "${uniqueName}" in "${relativePath}" has no attribute: "${level}"`,
  invalidRelationshipPath: (relationshipPath: string, uniqueName: string, relativePath: string): string =>
    `Invalid relationship path: ${relationshipPath}. Object "${uniqueName}" in "${relativePath}" has not existing relationship_path`,
  invalidRowSecurityRelationship: (uniqueName: string): string =>
    `Invalid relationship. There is no row security with ${uniqueName}`,
  mismatchedRelationshipKeys: (dataset: string, joinColumns: number, level: string, keyColumns: number): string =>
    `Invalid relationship. The number of join_columns in dataset ${dataset} (${joinColumns}) does not match the number of key_columns in level attribute ${level} (${keyColumns}).`,
};

export default class YamlCommonReferenceValidator implements IYamlCommonReferenceValidator {
  validateAndGetReferencedObject(
    referencedUniqueName: string,
    elementsMap: Map<string, IYamlParsedFile>,
    sourceFile: IYamlParsedFile,
    referencedObjectType: ObjectType,
    validatorOutput: ValidatorOutput
  ): IYamlParsedFile | undefined {
    const referencedObject = elementsMap.get(referencedUniqueName);
    if (!referencedObject) {
      validatorOutput
        .file(sourceFile)
        .addError(yamlCommonReferenceMessages.referenceObjectNotExist(referencedObjectType, referencedUniqueName));
      return;
    }

    if (referencedObject.data.object_type !== referencedObjectType) {
      validatorOutput
        .file(sourceFile)
        .addError(
          yamlCommonReferenceMessages.incorrectReference(
            referencedObjectType,
            referencedUniqueName,
            referencedObject.data.object_type
          )
        );
      return;
    }

    return referencedObject;
  }

  validateRelationships(
    item: IYamlParsedFile,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>
  ): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();
    const { relationships } = item.data as IYamlDimension | IYamlModel;

    if (!relationships) {
      return validatorOutput;
    }

    relationships.forEach((r: IYamlDimensionRelationship | IYamlModelRelationship) => {
      if (YamlDimensionTypeGuard.isRegularRelation(r)) {
        const targetDimension = r.type === YamlDimensionRelationType.Snowflake ? item.data.unique_name : r.to.dimension;

        this.validateDetachedRelationship(validatorOutput, item, r.from.dataset, ObjectType.Dataset);
        this.validateDetachedRelationship(validatorOutput, item, targetDimension, ObjectType.Dimension);

        if (r.from.dataset.length && targetDimension.length) {
          validatorOutput.append(this.validateLeftRelations(item, r, elementsMap, referencedObjectIds));
          validatorOutput.append(this.validateRightRelations(item, r, elementsMap, referencedObjectIds));
          validatorOutput.append(this.validateMismatchedRelationKeys(item, r, elementsMap, referencedObjectIds));
        }
      }

      if (YamlDimensionTypeGuard.isSecurityRelation(r)) {
        this.validateDetachedRelationship(validatorOutput, item, r.from.dataset, ObjectType.Dataset);
        this.validateDetachedRelationship(validatorOutput, item, r.to.row_security, ObjectType.RowSecurity);

        if (r.from.dataset.length && r.to.row_security.length) {
          validatorOutput.append(this.validateLeftRelations(item, r, elementsMap, referencedObjectIds));
          validatorOutput.append(this.validateRightRelations(item, r, elementsMap, referencedObjectIds));
        }
      }
    });

    return validatorOutput;
  }

  validateRelationshipsReferences(
    validatorOutput: ValidatorOutput,
    item: IYamlParsedFile,
    elementsMap: Map<string, IYamlParsedFile>
  ) {
    if (YamlObjectTypeGuard.isModel(item.data)) {
      const relationships: Array<IYamlModelRelationship | IYamlEmbeddedRelationship> = [...item.data.relationships];
      elementsMap.forEach((e) => {
        if (YamlObjectTypeGuard.isDimension(e.data) && e.data.relationships) {
          const embeddedRelationship = e.data.relationships.filter((r) => YamlDimensionTypeGuard.isEmbeddedRelation(r));
          relationships.push(...(embeddedRelationship as Array<IYamlEmbeddedRelationship>));
        }
      });
      if (item.data.drillthroughs) {
        item.data.drillthroughs.forEach((dt) => this.validateReferencePath(validatorOutput, item, dt, relationships));
      }
      if (item.data.aggregates) {
        item.data.aggregates.forEach((aggr) => this.validateReferencePath(validatorOutput, item, aggr, relationships));
      }
    }

    return validatorOutput;
  }

  private validateReferencePath(
    validatorOutput: ValidatorOutput,
    file: IYamlParsedFile,
    item: IYamlModelDrillThrough | IYamlModelAggregate,
    relationships: Array<IYamlModelRelationship | IYamlEmbeddedRelationship>
  ) {
    const relationshipsPaths: Array<string> = [];
    item.attributes?.forEach((a) => {
      if (a.relationships_path) {
        relationshipsPaths.push(...a.relationships_path);
      }
    });
    relationshipsPaths.forEach((rP) => {
      if (!relationships.some((r) => r.unique_name === rP)) {
        validatorOutput
          .file(file)
          .addError(yamlCommonReferenceMessages.invalidRelationshipPath(rP, item.unique_name, file.relativePath));
      }
    });
    return validatorOutput;
  }

  validateAttributesReferences(
    validatorOutput: ValidatorOutput,
    file: IYamlParsedFile<IYamlModel>,
    elementsMap: Map<string, IYamlParsedFile>,
    attributes: Array<IYamlAttributeReference>
  ) {
    attributes.forEach((attr) => {
      const dimension = this.validateAndGetReferencedObject(
        attr.dimension,
        elementsMap,
        file,
        ObjectType.Dimension,
        validatorOutput
      );
      if (!dimension) {
        return;
      }
      const yamlDimension = dimension.data as IYamlDimension;
      let hasReference = yamlDimension.level_attributes.some((lA) => lA.unique_name === attr.name);
      hasReference =
        hasReference ||
        yamlDimension.hierarchies
          .flatMap((h) => h.levels)
          .flatMap((l) => [...(l.secondary_attributes || []), ...(l.aliases || []), ...(l.metrics || [])])
          .some((sA) => sA?.unique_name === attr.name);

      if (!hasReference) {
        validatorOutput
          .file(file)
          .addError(`Dimension ${dimension.data.unique_name} has no referenced object ${attr.name}`);
      }
    });
  }

  validateMetricReferences(
    validatorOutput: ValidatorOutput,
    file: IYamlParsedFile<IYamlModel>,
    elementsMap: Map<string, IYamlParsedFile>,
    metrics: Array<string>
  ) {
    metrics.forEach((m) => {
      const referencedObject = elementsMap.get(m);
      if (!referencedObject) {
        validatorOutput
          .file(file)
          .addError(yamlCommonReferenceMessages.referenceObjectNotExist("Metric or CalcMetric", m));
      }
    });
  }

  private validateDetachedRelationship(
    validatorOutput: ValidatorOutput,
    item: IYamlParsedFile,
    detachedItem: string,
    objectType: string
  ): void {
    if (!detachedItem?.length) {
      validatorOutput
        .file(item)
        .addWarning(yamlCommonReferenceMessages.detachedRelationships(item.data.unique_name, objectType));
    }
  }

  private validateLeftRelations(
    file: IYamlParsedFile,
    relationship: IYamlDimensionRelationship | IYamlModelRelationship,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>
  ): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();

    // TODO: add check that file does not point to himself
    const referencedObject = this.validateAndGetReferencedObject(
      relationship.from.dataset,
      elementsMap,
      file,
      ObjectType.Dataset,
      validatorOutput
    );

    if (!referencedObject) {
      return validatorOutput;
    }

    referencedObjectIds.add(relationship.from.dataset);

    const hasInvalidDatasetRelation = !relationship.from.join_columns.every((joinColumn) =>
      (referencedObject as IYamlParsedFile<IYamlDataset>).data.columns.some(
        (datasetColumn) => joinColumn === datasetColumn.name
      )
    );

    if (hasInvalidDatasetRelation) {
      validatorOutput
        .file(file)
        .addError(
          yamlCommonReferenceMessages.invalidDatasetRelationship(
            referencedObject.data.unique_name,
            referencedObject.relativePath,
            relationship.from.join_columns
          )
        );
    }

    return validatorOutput;
  }

  private validateRightRelations(
    file: IYamlParsedFile,
    relationship: IYamlDimensionRelationship | IYamlModelRelationship,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>
  ): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();
    if (
      YamlDimensionTypeGuard.isSecurityRelation(relationship) ||
      YamlModelTypeGuard.isSecurityRelation(relationship)
    ) {
      // TODO: add check that file does not point to itself
      const referencedObject = this.validateAndGetReferencedObject(
        relationship.to.row_security,
        elementsMap,
        file,
        ObjectType.RowSecurity,
        validatorOutput
      );

      if (!referencedObject) {
        return validatorOutput;
      }

      referencedObjectIds.add(relationship.to.row_security);
      if (!referencedObject) {
        validatorOutput
          .file(file)
          .addError(yamlCommonReferenceMessages.invalidRowSecurityRelationship(relationship.to.row_security));
      }
      return validatorOutput;
    } else {
      const targetDimension =
        relationship.type === YamlDimensionRelationType.Snowflake ? file.data.unique_name : relationship.to.dimension;
      // TODO: add check that file does not point to himself
      const referencedObject = this.validateAndGetReferencedObject(
        targetDimension,
        elementsMap,
        file,
        ObjectType.Dimension,
        validatorOutput
      );

      if (!referencedObject) {
        return validatorOutput;
      }

      referencedObjectIds.add(targetDimension);

      const hasInvalidDimensionRelation = !(
        referencedObject as IYamlParsedFile<IYamlDimension>
      ).data.level_attributes.some((attr) => attr.unique_name === relationship.to.level);
      if (hasInvalidDimensionRelation) {
        validatorOutput
          .file(file)
          .addError(
            yamlCommonReferenceMessages.invalidDimensionRelationship(
              referencedObject.data.unique_name,
              referencedObject.relativePath,
              relationship.to.level
            )
          );
      }
      return validatorOutput;
    }
  }

  private validateMismatchedRelationKeys(
    file: IYamlParsedFile,
    relationship: IYamlDimensionRegularRelationship,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>
  ) {
    const validatorOutput = ValidatorOutput.create();

    const dimension = YamlDimensionTypeGuard.isSnowflakeRelation(relationship)
      ? file.data.unique_name
      : relationship.to.dimension;

    const yamlDimension = <IYamlParsedFile<IYamlDimension> | undefined>(
      this.validateAndGetReferencedObject(dimension, elementsMap, file, ObjectType.Dimension, validatorOutput)
    );

    if (!yamlDimension) {
      return validatorOutput;
    }

    referencedObjectIds.add(dimension);

    const { join_columns: joinColumns } = relationship.from;
    const { level_attributes: levelAttributes } = yamlDimension.data;

    const levelAttribute = <IYamlLevelFromOneDataset | undefined>(
      levelAttributes.find(byUniqueName(relationship.to.level))
    );

    if (!levelAttribute) {
      return validatorOutput;
    }

    const { key_columns: keyColumns } = levelAttribute;

    if (joinColumns.length !== keyColumns.length) {
      const error = yamlCommonReferenceMessages.mismatchedRelationshipKeys(
        relationship.from.dataset,
        joinColumns.length,
        relationship.to.level,
        keyColumns.length
      );

      validatorOutput.file(file).addError(error);
    }

    return validatorOutput;
  }
}
