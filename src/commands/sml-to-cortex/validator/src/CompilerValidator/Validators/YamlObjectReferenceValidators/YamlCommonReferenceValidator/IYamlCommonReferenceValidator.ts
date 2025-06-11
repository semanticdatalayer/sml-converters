import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlAttributeReference, IYamlModel } from "models/src/yaml/IYamlModel";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";

export default interface IYamlCommonReferenceValidator {
  validateAndGetReferencedObject(
    referencedUniqueName: string,
    elementsMap: Map<string, IYamlParsedFile>,
    sourceFile: IYamlParsedFile,
    referencedObjectType: ObjectType,
    validatorOutput: ValidatorOutput
  ): IYamlParsedFile | undefined;

  validateRelationships(
    item: IYamlParsedFile,
    elementsMap: Map<string, IYamlParsedFile>,
    referencedObjectIds: Set<string>
  ): ValidatorOutput;

  validateRelationshipsReferences(
    validatorOutput: ValidatorOutput,
    item: IYamlParsedFile,
    elementsMap: Map<string, IYamlParsedFile>
  ): ValidatorOutput;

  validateMetricReferences(
    validatorOutput: ValidatorOutput,
    file: IYamlParsedFile<IYamlModel>,
    elementsMap: Map<string, IYamlParsedFile>,
    metrics: Array<string>
  ): void;

  validateAttributesReferences(
    validatorOutput: ValidatorOutput,
    file: IYamlParsedFile<IYamlModel>,
    elementsMap: Map<string, IYamlParsedFile>,
    attributes: Array<IYamlAttributeReference>
  ): void;
}
