import YamlCalculatedMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlCalculatedMeasureBuilder";
import YamlDatasetBuilder from "models/src/builders/YamlObjectBuilders/YamlDatasetBuilder";
import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import YamlModelRelationBuilder from "models/src/builders/YamlObjectBuilders/YamlModelRelationBuilder";
import { Severity } from "models/src/IFileCompilationOutput";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import YamlModelTypeGuard from "models/src/yaml/guards/YamlModelTypeGuard";
import { IYamlCatalog } from "models/src/yaml/IYamlCatalog";
import { IYamlMeasure } from "models/src/yaml/IYamlMeasure";
import {
  IYamlModel,
  IYamlModelAggregate,
  IYamlModelMetricsAndCalc,
  IYamlModelOverride,
  IYamlQueryNameWithObjectType,
} from "models/src/yaml/IYamlModel";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import ValidatorOutput, { FileOutputAppender } from "../../../../ValidatorOutput/ValidatorOutput";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";
import YamlValidatorTestUtil from "../YamlValidatorTestUtil";
import { YamlModelValidator } from "./YamlModelValidator";
import { yamlModelErrorMessages, yamlModelWarningMessages } from "./YamlModelValidatorMessages";

const generateCommonReferenceValidator = <T extends IYamlObject>(data: T): IYamlCommonReferenceValidator => {
  return {
    validateAndGetReferencedObject: jest.fn().mockReturnValue({
      compilationOutput: [],
      data: data,
    }),
    validateRelationships: jest.fn().mockReturnValue(ValidatorOutput.create()),
    validateRelationshipsReferences: jest.fn().mockReturnValue(new ValidatorOutput()),
    validateAttributesReferences: jest.fn(),
    validateMetricReferences: jest.fn(),
  };
};
const modelBuilder = YamlModelBuilder.create();
let referencedObjectIds: Set<string> = new Set<string>();

const getObjectsMap = (...input: Array<IYamlParsedFile>): Map<string, IYamlParsedFile> => {
  const objectsMap = new Map<string, IYamlParsedFile>();
  input.forEach((b) => {
    objectsMap.set(b.data.unique_name, b);
  });
  return objectsMap;
};

const yamlMaeasureBuilder = YamlMeasureBuilder.create();
const yamlCalculatedMaeasureBuilder = YamlCalculatedMeasureBuilder.create();
const yamlDimensionBuilder = YamlDimensionBuilder.create();
const getYamlMeasureFile = (input: Partial<IYamlMeasure>) => yamlMaeasureBuilder.with({ ...input }).buildYamlFile();

describe("YamlModelValidator", () => {
  beforeEach(() => {
    referencedObjectIds = new Set<string>();
  });

  const measure = {
    calc: {
      name: "calc-measure",
    },
    first: "first_1",
    second: "second_2",
    third: "third_3",
    fourth: "fourth_4",
  };

  const orphan = {
    from: { dataset: "dataset", join_columns: [] },
  };

  it("Should validate measures unique names", () => {
    const commonValidator = generateCommonReferenceValidator(
      yamlMaeasureBuilder.with({ unique_name: "metric" }).build()
    );
    const modelWithMeasureFile = modelBuilder.addMetric("metric").buildYamlFile();

    const yamlModelValidator = new YamlModelValidator(commonValidator);
    yamlModelValidator.validateObject(
      modelWithMeasureFile,
      getObjectsMap(getYamlMeasureFile({ unique_name: "metric" })),
      referencedObjectIds
    );

    const measureName = modelWithMeasureFile.data.metrics[0];

    expect(referencedObjectIds).toContain(measureName.unique_name);
  });

  it("Should validate normal dimensions unique names", () => {
    const yamlCommonReferenceValidator = generateCommonReferenceValidator(
      yamlDimensionBuilder.uniqueName("dimension1").with({ is_degenerate: false }).build()
    );
    const modelWithDimFile = modelBuilder
      .addRelationship({ to: { dimension: "dimension1", level: "" } })
      .buildYamlFile();

    const yamlModelValidator = new YamlModelValidator(yamlCommonReferenceValidator);
    yamlModelValidator.validateObject(modelWithDimFile, getObjectsMap(), referencedObjectIds);

    const relationship = modelWithDimFile.data.relationships[0];
    if (YamlModelTypeGuard.isRegularRelation(relationship)) {
      const dimensionName = relationship.to.dimension;
      expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledWith(
        dimensionName,
        expect.anything(),
        expect.anything(),
        ObjectType.Dimension,
        expect.anything()
      );
      expect(referencedObjectIds).toContain(dimensionName);
    }
  });

  it("Should validate degenerate dimensions unique names", () => {
    const yamlCommonReferenceValidator = generateCommonReferenceValidator(
      yamlDimensionBuilder.uniqueName("degenerative dim").with({ is_degenerate: true }).build()
    );
    const modelWithDimFile = modelBuilder.addDegenerateDimension("degenerative dim").buildYamlFile();

    const yamlModelValidator = new YamlModelValidator(yamlCommonReferenceValidator);
    yamlModelValidator.validateObject(modelWithDimFile, getObjectsMap(), referencedObjectIds);

    const dimensionName = modelWithDimFile.data.dimensions?.shift();
    expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledWith(
      dimensionName,
      expect.anything(),
      expect.anything(),
      ObjectType.Dimension,
      expect.anything()
    );
    expect(referencedObjectIds).toContain(dimensionName);
  });

  it("Should return an error if dimension from relationship reference degenerate dimension", () => {
    const yamlCommonReferenceValidator = generateCommonReferenceValidator(
      yamlDimensionBuilder.uniqueName("degen_dimension").with({ is_degenerate: true }).build()
    );
    const modelWithDimFile = modelBuilder
      .addRelationship({ to: { dimension: "degen_dimension", level: "" } })
      .buildYamlFile();

    const yamlModelValidator = new YamlModelValidator(yamlCommonReferenceValidator);
    const validationOutput = yamlModelValidator.validateObject(modelWithDimFile, getObjectsMap(), referencedObjectIds);

    expect(validationOutput.hasErrors).toBe(true);
    const hasErrorMessage = validationOutput.hasFileErrorMessage(
      yamlModelErrorMessages.getDimensionDegenerateError(false, "degen_dimension")
    );
    expect(hasErrorMessage).toBe(true);
  });

  it("Should return an error if model dimensions reference a normal dimension", () => {
    const yamlCommonReferenceValidator = generateCommonReferenceValidator(
      yamlDimensionBuilder.uniqueName("normal_dimension").build()
    );
    const modelWithDimFile = modelBuilder.addDegenerateDimension("normal_dimension").buildYamlFile();

    const yamlModelValidator = new YamlModelValidator(yamlCommonReferenceValidator);
    const validationOutput = yamlModelValidator.validateObject(modelWithDimFile, getObjectsMap(), referencedObjectIds);

    expect(validationOutput.hasErrors).toBe(true);
    const hasErrorMessage = validationOutput.hasFileErrorMessage(
      yamlModelErrorMessages.getDimensionDegenerateError(true, "normal_dimension")
    );
    expect(hasErrorMessage).toBe(true);
  });

  it("Should call yamlCommonValidator validateRelationships", async () => {
    const yamlCommonReferenceValidator = generateCommonReferenceValidator(
      YamlDatasetBuilder.create().uniqueName("dataset1").addColumn("column1").build()
    );
    const yamlModelValidator = new YamlModelValidator(yamlCommonReferenceValidator);
    yamlModelValidator.validateObject(modelBuilder.buildYamlFile(), getObjectsMap(), referencedObjectIds);

    expect(yamlCommonReferenceValidator.validateRelationships).toHaveBeenCalled();
  });

  it("Should verify that calc measure expression measures are also referenced in the model", () => {
    const calcMeasureBuilder = yamlCalculatedMaeasureBuilder.uniqueName(measure.calc.name).with({
      expression: YamlValidatorTestUtil.generateValidMdx(measure.first, measure.second),
    });
    const yamlCommonReferenceValidator = generateCommonReferenceValidator(calcMeasureBuilder.build());
    const yamlModelValidator = new YamlModelValidator(yamlCommonReferenceValidator);
    const model = modelBuilder.addMetrics(measure.first, measure.second).addRelationship(orphan).buildYamlFile();

    const validationOutput = yamlModelValidator.validateObject(
      model,
      getObjectsMap(
        calcMeasureBuilder.buildYamlFile(),
        getYamlMeasureFile({ unique_name: measure.first }),
        getYamlMeasureFile({ unique_name: measure.second })
      ),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(false);
  });

  it("Should NOT return an error if the model contains calculated measure with expression that contains measure with different casing", () => {
    const upperCasing = measure.calc.name.toUpperCase();
    const calcMeasureBuilder = yamlCalculatedMaeasureBuilder
      .uniqueName(measure.calc.name)
      .with({ expression: YamlValidatorTestUtil.generateValidMdx(upperCasing) });
    const yamlCommonReferenceValidator = generateCommonReferenceValidator(calcMeasureBuilder.build());
    const model = modelBuilder.addMetric(measure.calc.name).addRelationship(orphan).buildYamlFile();
    const yamlModelValidator = new YamlModelValidator(yamlCommonReferenceValidator);
    const validationOutput = yamlModelValidator.validateObject(
      model,
      getObjectsMap(calcMeasureBuilder.buildYamlFile()),
      referencedObjectIds
    );

    const hasErrorMessage = validationOutput.hasFileErrorMessage(
      yamlModelErrorMessages.getCalcMeasureContainsANonExistingMeasure(measure.calc.name, upperCasing)
    );

    expect(hasErrorMessage).toBe(false);
  });

  it("Should not return an error if a model contains a regular measure with a dataset which is represented in the model relationships", () => {
    const measureWithDatasetBuilder = yamlMaeasureBuilder.with({
      unique_name: measure.first,
      dataset: "dataset",
    });
    const yamlCommonReferenceValidator = generateCommonReferenceValidator(measureWithDatasetBuilder.build());
    const modelWithMeasureFile = modelBuilder
      .addMetric(measure.first)
      .addRelationship({ from: { dataset: "dataset", join_columns: [] } })
      .buildYamlFile();
    const yamlModelValidator = new YamlModelValidator(yamlCommonReferenceValidator);
    const validationOutput = yamlModelValidator.validateObject(
      modelWithMeasureFile,
      getObjectsMap(measureWithDatasetBuilder.buildYamlFile()),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(false);
  });
});

class YamlModelValidatorValidateUniqueRelationships extends YamlModelValidator {
  constructor() {
    super({} as IYamlCommonReferenceValidator);
  }

  validateUniqueRelationships(fileAppender: FileOutputAppender, model: IYamlModel): void {
    super.validateUniqueRelationships(fileAppender, model);
  }
}

describe("YamlModelValidator.validateUniqueRelationships", () => {
  const relationBuilder = YamlModelRelationBuilder.create()
    .addFrom({
      dataset: "dataset",
      join_columns: ["col1", "col2"],
    })
    .addTo({
      dimension: "dimension",
      level: "level",
    });
  it("Should return error for each of the duplicate relationships", () => {
    const relation1 = relationBuilder.addFrom({ dataset: "ds1", join_columns: ["col1_1", "col1_2"] }).build();
    const relation2 = relationBuilder.addFrom({ dataset: "ds2", join_columns: ["col2_1", "col2_2"] }).build();
    const relation3 = relationBuilder.addFrom({ dataset: "ds3", join_columns: ["col3_1", "col3_2"] }).build();

    const yamlFile = modelBuilder
      .withRelationships([relation1, relation1, relation1, relation2, relation2, relation3])
      .buildYamlFile();

    const yamlModelValidator = new YamlModelValidatorValidateUniqueRelationships();
    const validatorOutput = ValidatorOutput.create();
    yamlModelValidator.validateUniqueRelationships(validatorOutput.file(yamlFile), yamlFile.data);

    expect(validatorOutput.hasErrors).toBe(true);

    expect(
      validatorOutput.hasFileErrorMessage(yamlModelErrorMessages.getDuplicateRelationshipsMessage(relation1, 3))
    ).toBe(true);
    expect(
      validatorOutput.hasFileErrorMessage(yamlModelErrorMessages.getDuplicateRelationshipsMessage(relation2, 2))
    ).toBe(true);
  });

  it("Should not return error if dataset differ", () => {
    const relation1 = relationBuilder.addFrom({ dataset: "ds1", join_columns: ["same"] }).build();
    const relation2 = relationBuilder.addFrom({ dataset: "ds2", join_columns: ["same"] }).build();

    const yamlFile = modelBuilder.withRelationships([relation1, relation2]).buildYamlFile();

    const yamlModelValidator = new YamlModelValidatorValidateUniqueRelationships();
    const validatorOutput = ValidatorOutput.create();
    yamlModelValidator.validateUniqueRelationships(validatorOutput.file(yamlFile), yamlFile.data);

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("Should not return error if from join_columns differ", () => {
    const relation1 = relationBuilder.addFrom({ dataset: "same", join_columns: ["col1", "col2"] }).build();
    const relation2 = relationBuilder.addFrom({ dataset: "same", join_columns: ["col1"] }).build();

    const yamlFile = modelBuilder.withRelationships([relation1, relation2]).buildYamlFile();

    const yamlModelValidator = new YamlModelValidatorValidateUniqueRelationships();
    const validatorOutput = ValidatorOutput.create();
    yamlModelValidator.validateUniqueRelationships(validatorOutput.file(yamlFile), yamlFile.data);

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("Should not return error if deimension differs", () => {
    const relation1 = relationBuilder.addTo({ dimension: "dim1", level: "same" }).build();
    const relation2 = relationBuilder.addTo({ dimension: "dim2", level: "same" }).build();

    const yamlFile = modelBuilder.withRelationships([relation1, relation2]).buildYamlFile();

    const yamlModelValidator = new YamlModelValidatorValidateUniqueRelationships();
    const validatorOutput = ValidatorOutput.create();
    yamlModelValidator.validateUniqueRelationships(validatorOutput.file(yamlFile), yamlFile.data);

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("Should not return error if level differs", () => {
    const relation1 = relationBuilder.addTo({ dimension: "same", level: "level1" }).build();
    const relation2 = relationBuilder.addTo({ dimension: "same", level: "level2" }).build();

    const yamlFile = modelBuilder.withRelationships([relation1, relation2]).buildYamlFile();

    const yamlModelValidator = new YamlModelValidatorValidateUniqueRelationships();
    const validatorOutput = ValidatorOutput.create();
    yamlModelValidator.validateUniqueRelationships(validatorOutput.file(yamlFile), yamlFile.data);

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("Should return error on duplicated relationships unique_names", () => {
    const relationship = relationBuilder.withName("sameName").build();

    const yamlFile = modelBuilder.addRelationship(relationship).addRelationship(relationship).buildYamlFile();

    const yamlModelValidator = new YamlModelValidatorValidateUniqueRelationships();
    const validatorOutput = ValidatorOutput.create();
    yamlModelValidator.validateUniqueRelationships(validatorOutput.file(yamlFile), yamlFile.data);

    expect(validatorOutput.hasErrors).toBe(true);
  });
});

// TODO check test setup, messages and cases.
describe("YamlModelValidator.validateUniqueRelationships", () => {
  class YamlModelValidatorValidateUniqueMetrics extends YamlModelValidator {
    constructor() {
      super({} as IYamlCommonReferenceValidator);
    }

    validateUniqueRelationships(fileAppender: FileOutputAppender, model: IYamlModel): void {
      super.validateUniqueRelationships(fileAppender, model);
    }
  }

  const metric1: IYamlModelMetricsAndCalc = { unique_name: "metric1" };
  const metric2: IYamlModelMetricsAndCalc = { unique_name: "metric2" };
  const metric3: IYamlModelMetricsAndCalc = { unique_name: "metric3" };

  it("Should return error for each of the duplicate metrics", () => {
    const yamlFile = modelBuilder
      .addMetrics(
        metric1.unique_name,
        metric1.unique_name,
        metric1.unique_name,
        metric2.unique_name,
        metric2.unique_name,
        metric3.unique_name
      )
      .buildYamlFile();

    const yamlModelValidator = new YamlModelValidatorValidateUniqueMetrics();
    const validatorOutput = ValidatorOutput.create();
    yamlModelValidator.validateUniqueMetrics(validatorOutput.file(yamlFile), yamlFile.data);

    expect(validatorOutput.hasErrors).toBe(true);
    expect(validatorOutput.hasFileErrorMessage(yamlModelErrorMessages.getDuplicateMetricUniqueNames(metric1, 3))).toBe(
      true
    );
    expect(validatorOutput.hasFileErrorMessage(yamlModelErrorMessages.getDuplicateMetricUniqueNames(metric2, 2))).toBe(
      true
    );
    expect(validatorOutput.hasFileErrorMessage(yamlModelErrorMessages.getDuplicateMetricUniqueNames(metric3, 1))).toBe(
      false
    );
  });

  it("Should not return errors when there are no duplicate metrics", () => {
    const yamlFile = modelBuilder
      .addMetrics(metric1.unique_name, metric2.unique_name, metric3.unique_name)
      .buildYamlFile();

    const yamlModelValidator = new YamlModelValidatorValidateUniqueMetrics();
    const validatorOutput = ValidatorOutput.create();
    yamlModelValidator.validateUniqueMetrics(validatorOutput.file(yamlFile), yamlFile.data);

    expect(validatorOutput.hasErrors).toBe(false);
  });
});

describe("YamlModelValidator.validateAggregates", () => {
  const aggBuilder = AnyObjectBuilder.from<IYamlModelAggregate>({
    label: "test",
    unique_name: "",
    attributes: [],
    metrics: [],
  });

  const getAggregate = (input: Partial<IYamlModelAggregate>) => aggBuilder.with(input).build();
  it("Should return a warning for aggregate with target_connection", () => {
    const commonValidator = generateCommonReferenceValidator(yamlMaeasureBuilder.build());
    const yamlFile = modelBuilder
      .addAggregate(getAggregate({ unique_name: "agg1" }))
      .addAggregate(getAggregate({ unique_name: "agg2", target_connection: "test" } as unknown as IYamlModelAggregate))
      .buildYamlFile();
    const validatorOutput = ValidatorOutput.create();

    const yamlModelValidator = new YamlModelValidator(commonValidator);

    yamlModelValidator.validateAggregates(validatorOutput, yamlFile, getObjectsMap());

    const warningMessages = validatorOutput.getFileOutput(yamlFile, Severity.Warning).map((o) => o.message);
    expect(warningMessages).toContain(yamlModelWarningMessages.getTargetConnectionWarning("agg2", 1));
  });
});

describe("validateDatasetsProperties", () => {
  class YamlModelValidatorValidateDatasetProperties extends YamlModelValidator {
    constructor() {
      super({} as IYamlCommonReferenceValidator);
    }

    validateDatasetsProperties(
      validatorOutput: ValidatorOutput,
      file: IYamlParsedFile<IYamlModel | IYamlCatalog>,
      elementsMap: Map<string, IYamlParsedFile<IYamlObject>>
    ): void {
      return super.validateDatasetsProperties(validatorOutput, file, elementsMap);
    }
  }

  it("Should throw an error if the dataset doesn't exist", () => {
    const yamlFile = modelBuilder.addDatasetProperties("datasetName").buildYamlFile();
    const validatorOutput = ValidatorOutput.create();
    const yamlModelValidator = new YamlModelValidatorValidateDatasetProperties();

    yamlModelValidator.validateDatasetsProperties(validatorOutput, yamlFile, new Map());

    expect(validatorOutput.hasErrors).toBe(true);
  });

  it("Should throw an error if properties are not dataset", () => {
    const dimName = "dimension1";
    const yamlFile = modelBuilder.addDatasetProperties(dimName).buildYamlFile();
    const validatorOutput = ValidatorOutput.create();
    const yamlModelValidator = new YamlModelValidatorValidateDatasetProperties();
    const dimension = yamlDimensionBuilder.uniqueName(dimName).with({ is_degenerate: false }).buildYamlFile();

    yamlModelValidator.validateDatasetsProperties(
      validatorOutput,
      yamlFile,
      getObjectsMap(dimension as IYamlParsedFile<IYamlObject>)
    );

    expect(validatorOutput.hasErrors).toBe(true);
  });
});

describe("Overrides", () => {
  const metric = "metric1";
  const metric2 = "metric2";
  const metric3 = "metric3";
  const metric4 = "metric4";
  const dimension = "dimension1";
  const overrides = YamlValidatorTestUtil.createOverrides({ [metric]: "query_measure", [dimension]: "query_dim" });
  const getModelWithOverrides = (fileOverrides: IYamlModelOverride) => {
    return modelBuilder
      .addMetric(metric)
      .addDegenerateDimension(dimension)
      .withOverrides(fileOverrides)
      .buildYamlFile();
  };
  it("Should return INFO message if overrides are defined", () => {
    const commonValidator = generateCommonReferenceValidator(yamlMaeasureBuilder.build());
    const yamlFile = modelBuilder.withOverrides(overrides).buildYamlFile();
    const validatorOutput = ValidatorOutput.create();

    const yamlModelValidator = new YamlModelValidator(commonValidator);
    yamlModelValidator.validateOverrides(validatorOutput, yamlFile);

    expect(validatorOutput.hasFileInfoMessage(yamlModelErrorMessages.overridesInfo)).toBe(true);
  });

  it("Should return NO error if all overrides are referenced in the model in either the metrics or the dimensions list", () => {
    const commonValidator = generateCommonReferenceValidator(yamlMaeasureBuilder.build());
    const yamlFile = getModelWithOverrides(overrides);
    const validatorOutput = ValidatorOutput.create();

    const yamlModelValidator = new YamlModelValidator(commonValidator);
    yamlModelValidator.validateOverrides(validatorOutput, yamlFile);

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("Should return error if an override is not referenced in the model in metrics list", () => {
    const commonValidator = generateCommonReferenceValidator(yamlMaeasureBuilder.build());
    const yamlFile = modelBuilder.addDegenerateDimension(dimension).withOverrides(overrides).buildYamlFile();
    const validatorOutput = ValidatorOutput.create();

    const yamlModelValidator = new YamlModelValidator(commonValidator);
    yamlModelValidator.validateOverrides(validatorOutput, yamlFile);

    const errorMsg = yamlModelErrorMessages.getOverrideNotReferencedInModel(metric);
    expect(validatorOutput.hasErrors).toBe(true);
    expect(validatorOutput.hasFileErrorMessage(errorMsg)).toBe(true);
  });

  it("Should return error if an override is not referenced in the model in dimensions list", () => {
    const commonValidator = generateCommonReferenceValidator(yamlMaeasureBuilder.build());
    const yamlFile = modelBuilder.addMetric(metric).withOverrides(overrides).buildYamlFile();
    const validatorOutput = ValidatorOutput.create();

    const yamlModelValidator = new YamlModelValidator(commonValidator);
    yamlModelValidator.validateOverrides(validatorOutput, yamlFile);

    const errorMsg = yamlModelErrorMessages.getOverrideNotReferencedInModel(dimension);
    expect(validatorOutput.hasErrors).toBe(true);
    expect(validatorOutput.hasFileErrorMessage(errorMsg)).toBe(true);
  });

  it("Should return errors if an override is not referenced in the model in dimensions or measures list", () => {
    const commonValidator = generateCommonReferenceValidator(yamlMaeasureBuilder.build());
    const yamlFile = modelBuilder.withOverrides(overrides).buildYamlFile();
    const validatorOutput = ValidatorOutput.create();

    const yamlModelValidator = new YamlModelValidator(commonValidator);
    yamlModelValidator.validateOverrides(validatorOutput, yamlFile);

    const errorMsgForMetric = yamlModelErrorMessages.getOverrideNotReferencedInModel(metric);
    const errorMsgForDimension = yamlModelErrorMessages.getOverrideNotReferencedInModel(dimension);
    expect(validatorOutput.hasErrors).toBe(true);
    expect(validatorOutput.hasFileErrorMessage(errorMsgForMetric)).toBe(true);
    expect(validatorOutput.hasFileErrorMessage(errorMsgForDimension)).toBe(true);
  });

  it("Should return errors if metrics/dimensions have duplicates on a query_name", () => {
    const queryName = "queryName";
    const overrides = YamlValidatorTestUtil.createOverrides({ [metric]: queryName, [dimension]: queryName });
    const commonValidator = generateCommonReferenceValidator(yamlMaeasureBuilder.build());
    const yamlFile = getModelWithOverrides(overrides);

    const validatorOutput = ValidatorOutput.create();

    const yamlModelValidator = new YamlModelValidator(commonValidator);
    yamlModelValidator.validateOverrides(validatorOutput, yamlFile);

    const queryNameObjects: IYamlQueryNameWithObjectType[] = [
      { unique_name: metric, query_name: queryName, object_type: ObjectType.Measure },
      { unique_name: dimension, query_name: queryName, object_type: ObjectType.Dimension },
    ];
    const errorMsg = yamlModelErrorMessages.getOverridesDuplicateOnQueryNames(queryNameObjects);
    expect(validatorOutput.hasErrors).toBe(true);
    expect(validatorOutput.hasFileErrorMessage(errorMsg)).toBe(true);
  });

  it("Should return errors without case sensitivity if metrics/dimensions have duplicates on a query_name", () => {
    const queryName = "queryName";
    const upperCasing = queryName.toUpperCase();
    const overrides = YamlValidatorTestUtil.createOverrides({ [metric]: queryName, [dimension]: upperCasing });
    const commonValidator = generateCommonReferenceValidator(yamlMaeasureBuilder.build());
    const yamlFile = getModelWithOverrides(overrides);

    const validatorOutput = ValidatorOutput.create();

    const yamlModelValidator = new YamlModelValidator(commonValidator);
    yamlModelValidator.validateOverrides(validatorOutput, yamlFile);

    const queryNameObjects: IYamlQueryNameWithObjectType[] = [
      { unique_name: metric, query_name: queryName, object_type: ObjectType.Measure },
      { unique_name: dimension, query_name: upperCasing, object_type: ObjectType.Dimension },
    ];
    const errorMsg = yamlModelErrorMessages.getOverridesDuplicateOnQueryNames(queryNameObjects);
    expect(validatorOutput.hasErrors).toBe(true);
    expect(validatorOutput.hasFileErrorMessage(errorMsg)).toBe(true);
  });

  it("Should return errors if metrics/dimensions have duplicates on result query_name", () => {
    const overrides = YamlValidatorTestUtil.createOverrides({
      [metric2]: metric,
      [dimension]: metric3,
      [metric4]: "query_metric4",
    });
    const commonValidator = generateCommonReferenceValidator(yamlMaeasureBuilder.build());
    const yamlFile = modelBuilder
      .addMetrics(metric, metric2, metric3, metric4)
      .addDegenerateDimension(dimension)
      .withOverrides(overrides)
      .buildYamlFile();

    const validatorOutput = ValidatorOutput.create();

    const yamlModelValidator = new YamlModelValidator(commonValidator);
    yamlModelValidator.validateOverrides(validatorOutput, yamlFile);

    const queryNameObjects1: IYamlQueryNameWithObjectType[] = [
      { unique_name: metric, query_name: metric, object_type: ObjectType.Measure },
      { unique_name: metric2, query_name: metric, object_type: ObjectType.Measure },
    ];
    const queryNameObjects2: IYamlQueryNameWithObjectType[] = [
      { unique_name: metric3, query_name: metric3, object_type: ObjectType.Measure },
      { unique_name: dimension, query_name: metric3, object_type: ObjectType.Dimension },
    ];
    const errorMsg1 = yamlModelErrorMessages.getOverridesDuplicateOnQueryNames(queryNameObjects1);
    const errorMsg2 = yamlModelErrorMessages.getOverridesDuplicateOnQueryNames(queryNameObjects2);

    expect(validatorOutput.hasErrors).toBe(true);
    expect(validatorOutput.hasFileErrorMessage(errorMsg1)).toBe(true);
    expect(validatorOutput.hasFileErrorMessage(errorMsg2)).toBe(true);
  });
});
