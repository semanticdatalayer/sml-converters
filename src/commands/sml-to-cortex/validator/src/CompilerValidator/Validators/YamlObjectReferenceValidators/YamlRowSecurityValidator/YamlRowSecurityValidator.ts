import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import YamlRowSecurityTypeGuard from "models/src/yaml/guards/YamlRowSecurityTypeGuard";
import { IYamlDataset } from "models/src/yaml/IYamlDataset";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { IYamlRowSecurity } from "models/src/yaml/IYamlRowSecurity";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import { IYamlObjectValidator } from "../../IYamlObjectValidator";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";

export const yamlRowSecurityErrors = {
  missingIdsColumn: (column: string, dataset: string): string =>
    `Missing ids_column. Column "${column}" does not exist in "${dataset}" dataset`,
  missingFilterKeyColumn: (column: string, dataset: string): string =>
    `Missing filter_key_column. Column "${column}" does not exist in "${dataset}" dataset`,
  notExistingDataset: (dataset: string): string => `Dataset "${dataset}" does not exist`,
};

export class YamlRowSecurityValidator implements IYamlObjectValidator {
  private readonly yamlCommonReferenceValidator: IYamlCommonReferenceValidator;

  constructor(yamlCommonReferenceValidator: IYamlCommonReferenceValidator) {
    this.yamlCommonReferenceValidator = yamlCommonReferenceValidator;
  }

  validateObject(
    item: IYamlParsedFile<IYamlObject>,
    elementsMap: Map<string, IYamlParsedFile<IYamlObject>>,
    referencedObjectIds: Set<string>
  ): ValidatorOutput {
    const rowSecurity = item.data as IYamlRowSecurity;
    const validatorOutput = ValidatorOutput.create();

    if (YamlRowSecurityTypeGuard.hasDatasetProp(rowSecurity)) {
      const referencedObject = this.yamlCommonReferenceValidator.validateAndGetReferencedObject(
        rowSecurity.dataset,
        elementsMap,
        item,
        ObjectType.Dataset,
        validatorOutput
      );

      if (!referencedObject) {
        return validatorOutput;
      }

      referencedObjectIds.add(rowSecurity.dataset);

      const referencedDataset = referencedObject.data as IYamlDataset;
      const ids_column = referencedDataset.columns.find((c) => c.name === rowSecurity.ids_column);
      const filter_key_column = referencedDataset.columns.find((c) => c.name === rowSecurity.filter_key_column);

      if (!ids_column) {
        validatorOutput
          .file(item)
          .addError(yamlRowSecurityErrors.missingIdsColumn(rowSecurity.ids_column, referencedObject.data.unique_name));
      }
      if (!filter_key_column) {
        validatorOutput
          .file(item)
          .addError(
            yamlRowSecurityErrors.missingFilterKeyColumn(
              rowSecurity.filter_key_column,
              referencedObject.data.unique_name
            )
          );
        return validatorOutput;
      }
    }
    return validatorOutput;
  }
}
