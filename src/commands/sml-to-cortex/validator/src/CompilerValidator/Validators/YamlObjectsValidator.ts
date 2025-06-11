import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";

import ValidatorOutput from "../../ValidatorOutput/ValidatorOutput";
import { ICompilerValidatorFn } from "../ICompilerValidator";
import ExpressionValidator from "./ExpressionValidator/ExpressionValidator";
import { IYamlObjectValidator } from "./IYamlObjectValidator";
import { DummyYamlObjectValidator } from "./YamlObjectReferenceValidators/DummyYamlObjectValidator/DummyYamlObjectValidator";
import { YamlCatalogValidator } from "./YamlObjectReferenceValidators/YamlCatalogValidator/YamlCatalogValidator";
import YamlCommonReferenceValidator from "./YamlObjectReferenceValidators/YamlCommonReferenceValidator/YamlCommonReferenceValidator";
import { YamlCompositeModelValidator } from "./YamlObjectReferenceValidators/YamlCompositeModelValidator/YamlCompositeModelValidator";
import { YamlConnectionValidator } from "./YamlObjectReferenceValidators/YamlConnectionValidator/YamlConnectionValidator";
import { YamlDatasetValidator } from "./YamlObjectReferenceValidators/YamlDatasetValidator/YamlDatasetValidator";
import { YamlDimensionValidator } from "./YamlObjectReferenceValidators/YamlDimensionValidator/YamlDimensionValidator";
import YamlErrorContextUtil from "./YamlObjectReferenceValidators/YamlErrorContextUtil";
import { YamlMeasureCalcValidator } from "./YamlObjectReferenceValidators/YamlMeasureCalcValidator/YamlMeasureCalcValidator";
import { YamlMeasureValidator } from "./YamlObjectReferenceValidators/YamlMeasureValidator/YamlMeasureValidator";
import { YamlModelValidator } from "./YamlObjectReferenceValidators/YamlModelValidator/YamlModelValidator";
import { YamlRowSecurityValidator } from "./YamlObjectReferenceValidators/YamlRowSecurityValidator/YamlRowSecurityValidator";

const yamlCommonReferenceValidator = new YamlCommonReferenceValidator();
const expressionValidator = new ExpressionValidator();
const modelValidator = new YamlModelValidator(yamlCommonReferenceValidator);
const yamlErrorContextUtil = new YamlErrorContextUtil();

const yamlObjectsValidators: Record<ObjectType, IYamlObjectValidator> = {
  [ObjectType.Dataset]: new YamlDatasetValidator(yamlCommonReferenceValidator),
  [ObjectType.Dimension]: new YamlDimensionValidator(
    yamlCommonReferenceValidator,
    expressionValidator,
    yamlErrorContextUtil
  ),
  [ObjectType.Measure]: new YamlMeasureValidator(yamlCommonReferenceValidator),
  [ObjectType.MeasureCalc]: new YamlMeasureCalcValidator(expressionValidator),
  [ObjectType.Model]: modelValidator,
  [ObjectType.ModelSettings]: new DummyYamlObjectValidator(),
  [ObjectType.GlobalSettings]: new DummyYamlObjectValidator(),
  [ObjectType.Connection]: new YamlConnectionValidator(),
  [ObjectType.RowSecurity]: new YamlRowSecurityValidator(yamlCommonReferenceValidator),
  [ObjectType.Catalog]: new YamlCatalogValidator(modelValidator),
  [ObjectType.CompositeModel]: new YamlCompositeModelValidator(yamlCommonReferenceValidator),
};

export class YamlObjectsValidator implements ICompilerValidatorFn {
  static create(): YamlObjectsValidator {
    return new YamlObjectsValidator();
  }

  getObjectValidator(objectType: ObjectType): IYamlObjectValidator {
    return yamlObjectsValidators[objectType];
  }

  validate(yamlParsedFiles: Array<IYamlParsedFile>): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();
    const referencedObjectIds = new Set<string>();
    const elementsMap = new Map<string, IYamlParsedFile>();

    yamlParsedFiles.forEach((file) => elementsMap.set(file.data.unique_name, file));

    yamlParsedFiles.forEach((o) => {
      const validator = this.getObjectValidator(o.data.object_type);
      validatorOutput.append(validator.validateObject(o, elementsMap, referencedObjectIds));
    });

    const noReferencesFiles = yamlParsedFiles
      .filter(
        (y) =>
          y.data.object_type !== ObjectType.Model &&
          y.data.object_type !== ObjectType.CompositeModel &&
          y.data.object_type !== ObjectType.Catalog &&
          y.data.object_type !== ObjectType.ModelSettings &&
          y.data.object_type !== ObjectType.GlobalSettings
      )
      .filter((y) => !referencedObjectIds.has(y.data.unique_name));

    noReferencesFiles.forEach((f) => {
      validatorOutput.file(f).addWarning("File not in use. File has no references to it.");
    });

    return validatorOutput;
  }
}
