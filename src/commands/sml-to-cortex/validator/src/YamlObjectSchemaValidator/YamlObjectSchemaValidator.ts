import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import catalogSchema from "models/src/schemas/catalog.schema.json";
import connectionSchema from "models/src/schemas/connection.schema.json";
import datasetSchema from "models/src/schemas/dataset.schema.json";
import dimensionSchema from "models/src/schemas/dimension.schema.json";
import measureSchema from "models/src/schemas/measure.schema.json";
import measureCalcSchema from "models/src/schemas/measureCalc.schema.json";
import modelSchema from "models/src/schemas/model.schema.json";
import rowSecuritySchema from "models/src/schemas/rowSecurity.schema.json";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import { ICompilerValidatorFn } from "../CompilerValidator/ICompilerValidator";
import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";
import DummyYamlObjectSchemaValidator from "./DummyYamlObjectSchemaValidator/DummyYamlObjectSchemaValidator";
import { IYamlObjectSchemaValidator } from "./IYamlObjectSchemaValidator";
import { SchemaValidatorWrapper } from "./SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlCatalogSchemaValidator from "./YamlCatalogSchemaValidator/YamlCatalogSchemaValidator";
import YamlCompositeModelSchemaValidator from "./YamlCompositeModelSchemaValidator/YamlCompositeModelSchemaValidator";
import YamlConnectionSchemaValidator from "./YamlConnectionSchemaValidator/YamlConnectionSchemaValidator";
import YamlDatasetSchemaValidator from "./YamlDatasetSchemaValidator/YamlDatasetSchemaValidator";
import YamlDimensionSchemaValidator from "./YamlDimensionSchemaValidator/YamlDimensionSchemaValidator";
import YamlMeasureCalcSchemaValidator from "./YamlMeasureCalcSchemaValidator/YamlMeasureSchemaValidator";
import YamlMeasureSchemaValidator from "./YamlMeasureSchemaValidator/YamlMeasureSchemaValidator";
import YamlModelSchemaValidator from "./YamlModelSchemaValidators/YamlModelSchemaValidator";

const defaultObjectValidatorMappings: Record<ObjectType, IYamlObjectSchemaValidator> = {
  [ObjectType.Model]: new YamlModelSchemaValidator(new SchemaValidatorWrapper({ allErrors: true }), modelSchema),
  [ObjectType.Dimension]: new YamlDimensionSchemaValidator(
    new SchemaValidatorWrapper({ allErrors: true }),
    dimensionSchema
  ),
  [ObjectType.RowSecurity]: new YamlDatasetSchemaValidator(
    new SchemaValidatorWrapper({ allErrors: true }),
    rowSecuritySchema
  ),
  [ObjectType.Dataset]: new YamlDatasetSchemaValidator(new SchemaValidatorWrapper({ allErrors: true }), datasetSchema),
  [ObjectType.Measure]: new YamlMeasureSchemaValidator(new SchemaValidatorWrapper({ allErrors: true }), measureSchema),
  [ObjectType.MeasureCalc]: new YamlMeasureCalcSchemaValidator(
    new SchemaValidatorWrapper({ allErrors: true }),
    measureCalcSchema
  ),
  [ObjectType.Connection]: new YamlConnectionSchemaValidator(
    new SchemaValidatorWrapper({ allErrors: true }),
    connectionSchema
  ),
  [ObjectType.Catalog]: new YamlCatalogSchemaValidator(new SchemaValidatorWrapper({ allErrors: true }), catalogSchema),
  [ObjectType.CompositeModel]: new YamlCompositeModelSchemaValidator(new SchemaValidatorWrapper({ allErrors: true })),
  [ObjectType.ModelSettings]: new DummyYamlObjectSchemaValidator(),
  [ObjectType.GlobalSettings]: new DummyYamlObjectSchemaValidator(),
};

export default class YamlObjectSchemaValidator implements ICompilerValidatorFn {
  static create() {
    return new YamlObjectSchemaValidator();
  }

  constructor(private readonly objectValidatorMappings = defaultObjectValidatorMappings) {}

  getValidator(objectType: ObjectType): IYamlObjectSchemaValidator {
    return this.objectValidatorMappings[objectType];
  }

  validate(yamlParsedFiles: Array<IYamlParsedFile<IYamlObject>>): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();
    yamlParsedFiles.forEach((yamlFile) => {
      const result = this.getValidator(yamlFile.data.object_type).validateAML(yamlFile);
      if (!result.isValid) {
        result.errors.forEach((err: string) => validatorOutput.file(yamlFile).addError(err));
      }
    });
    return validatorOutput;
  }
}
