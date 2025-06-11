import YamlCalculatedMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlCalculatedMeasureBuilder";
import YamlConnectionBuilder from "models/src/builders/YamlObjectBuilders/YamlConnectionBuilder";
import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import { IValidationOutputContext } from "models/src/IFileCompilationOutput";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import {
  IYamlDimensionHierarchy,
  IYamlDimensionLevel,
  IYamlDimensionMetric,
  IYamlDimensionSecondaryAttribute,
} from "models/src/yaml/IYamlDimension";
import { CalculationMethod } from "models/src/yaml/IYamlMeasure";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import ValidatorOutput from "../../ValidatorOutput/ValidatorOutput";
import YamlErrorContextUtil from "./YamlObjectReferenceValidators/YamlErrorContextUtil";
import {
  DimensionalAttribute,
  DuplicateObjType,
  YamlPerspectiveModelTypes,
  YamlUniquenessErrors,
  YamlUniquenessValidator,
} from "./YamlUniquenessValidator";

const generateParsedFiles = (...uniqueNames: Array<string>): Array<IYamlParsedFile> => {
  return uniqueNames.map((name, index) => {
    const yamFile = YamlConnectionBuilder.create()
      .with({
        unique_name: name,
        label: name,
      })
      .buildYamlFile();
    yamFile.relativePath = `${name}_${index}.yml`;
    return yamFile;
  });
};

const getSecondaryAttribute = (uniqueName: string) =>
  AnyObjectBuilder.from<IYamlDimensionSecondaryAttribute>({
    dataset: "dataset",
    label: uniqueName,
    name_column: `${uniqueName}_name_column`,
    unique_name: uniqueName,
  }).build();

const getDimensionMetric = (uniqueName: string) =>
  AnyObjectBuilder.from<IYamlDimensionMetric>({
    dataset: "dataset",
    label: uniqueName,
    unique_name: uniqueName,
    calculation_method: CalculationMethod.Average,
    column: "calc-column",
  }).build();

const getHierarchyWithMetrics = (hierarchyName: string, ...metricNames: Array<string>) =>
  AnyObjectBuilder.fromPartial<IYamlDimensionHierarchy>({
    unique_name: hierarchyName,
    levels: [{ unique_name: `${hierarchyName}_level_1`, metrics: metricNames.map(getDimensionMetric) }],
  }).build();

const dimensionBuilder = YamlDimensionBuilder.create();

describe("validateForUniqueness", () => {
  const uniquenessValidator = YamlUniquenessValidator.create(new YamlErrorContextUtil());
  const hierarchy = {
    h_1: "h_1",
    h_2: "h_2",
  };

  describe("verify file unique names", () => {
    it("should not return an error if all objects have unique names", () => {
      const input = generateParsedFiles("name1", "name2", "name3");

      const validationOutput = uniquenessValidator.validate(input);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("should return an error if has equal names with case difference", () => {
      const name = "name";
      const input = generateParsedFiles(name, name.toUpperCase());

      const validationOutput = uniquenessValidator.validate(input);

      expect(validationOutput.hasErrors).toBe(true);
    });

    it("should return more than one error if there are more than one file with the same unique name", () => {
      const name1 = "name1";
      const name2 = "name2";
      const input = generateParsedFiles(name1, name2, name1, name2, name2);

      const validationOutput = uniquenessValidator.validate(input);

      const filesWithErrors = validationOutput.getFilesWithErrors();
      expect(filesWithErrors).toHaveLength(input.length);
      const name1Files = filesWithErrors.filter((x) => x.relativePath.startsWith(name1));
      expect(name1Files.every((f) => f.compilationOutput.length === 1)).toBe(true);
      const name2Files = filesWithErrors.filter((x) => x.relativePath.startsWith(name2));
      expect(name2Files.every((f) => f.compilationOutput.length === 2)).toBe(true);
    });
  });

  describe("verify dimension scope hierarchy uniqueness", () => {
    it("Should not return error if there are duplicate hierarchy names but in different files", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addHierarchy({ unique_name: "hierarchy", levels: [] })
        .buildYamlFile();
      const dim2 = YamlDimensionBuilder.create()
        .uniqueName("dim2")
        .addHierarchy({ unique_name: "hierarchy", levels: [] })
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1, dim2]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should return error if there are duplicate hierarchy names within same dimension", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addHierarchy({ unique_name: "hierarchy", levels: [] })
        .addHierarchy({ unique_name: "hierarchy", levels: [] })
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1]);

      expect(validationOutput.hasErrors).toBe(true);
    });
  });

  describe("verify dimension scope secondary_attribute uniqueness", () => {
    it("Should not return error if there are duplicate secondary_attribute names but in different files", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addLevelAttribute({ unique_name: "levelAttr" })
        .buildYamlFile();
      const dim2 = YamlDimensionBuilder.create()
        .uniqueName("dim2")
        .addAttributeByUniqueName({ unique_name: "levelAttr" })
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1, dim2]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should return error if there are duplicate secondary_attribute names within same hierarchy", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addHierarchy({
          unique_name: "h1",
          levels: [
            {
              unique_name: "level1",
              secondary_attributes: [getSecondaryAttribute("secondaryAttr"), getSecondaryAttribute("secondaryAttr")],
            },
          ],
        })
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1]);

      expect(validationOutput.hasErrors).toBe(true);
    });

    it("Should return error if there are duplicate secondary_attribute names within different hierarchies", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addHierarchy({
          unique_name: "h1",
          levels: [
            {
              unique_name: "level1",
              secondary_attributes: [getSecondaryAttribute("secondaryAttr")],
            },
          ],
        })
        .addHierarchy({
          unique_name: "h2",
          levels: [
            {
              unique_name: "h2.l1",
              secondary_attributes: [getSecondaryAttribute("secondaryAttr")],
            },
          ],
        })
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1]);

      expect(validationOutput.hasErrors).toBe(true);
    });
  });

  describe("verify dimension scope level_attribute uniqueness", () => {
    it("Should not return error if there are duplicate level_attribute names but in different files", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addAttributeByUniqueName({ unique_name: "levelAttr" })
        .buildYamlFile();
      const dim2 = YamlDimensionBuilder.create()
        .uniqueName("dim2")
        .addAttributeByUniqueName({ unique_name: "levelAttr" })
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1, dim2]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should return error if there are duplicate level_attribute names within same dimension", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addAttributeByUniqueName({ unique_name: "levelAttr" })
        .addAttributeByUniqueName({ unique_name: "levelAttr" })
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1]);

      expect(validationOutput.hasErrors).toBe(true);
    });
  });

  describe("Verify dimension metrical attributes uniqueness", () => {
    it("Should not return error if metrical attributes differ within the same file", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addHierarchy(getHierarchyWithMetrics("hierarchy", "metrical1", "metrical2"))
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should return error if there are duplicate metrical_attribute names within same dimension hierarchy", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addHierarchy(getHierarchyWithMetrics("hierarchy", "metrical1", "metrical1"))
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1]);

      expect(validationOutput.hasErrors).toBe(true);
    });

    it("Should return error if there are duplicate metrical_attribute names within different dimension hierarchy", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addHierarchy(getHierarchyWithMetrics("hierarchy1", "metrical1"))
        .addHierarchy(getHierarchyWithMetrics("hierarchy2", "metrical1"))
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1]);

      expect(validationOutput.hasErrors).toBe(true);
    });

    it("Should return error if there are duplicate metrical_attribute with regular measure", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addHierarchy(getHierarchyWithMetrics("hierarchy1", "metrical1"))
        .buildYamlFile();

      const measure1 = YamlMeasureBuilder.create().uniqueName("metrical1").buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1, measure1]);

      expect(validationOutput.hasErrors).toBe(true);
    });

    it("Should return error if there are duplicate metrical_attribute with calculated measure", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addHierarchy(getHierarchyWithMetrics("hierarchy1", "metrical1"))
        .buildYamlFile();

      const measure1 = YamlCalculatedMeasureBuilder.create().uniqueName("metrical1").buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1, measure1]);

      expect(validationOutput.hasErrors).toBe(true);
    });

    it("Should not return error if there are no  duplicate metrical_attribute with calculated measure and measure", () => {
      const dim1 = YamlDimensionBuilder.create()
        .uniqueName("dim1")
        .addHierarchy(getHierarchyWithMetrics("hierarchy1", "metrical1"))
        .buildYamlFile();

      const measure = YamlMeasureBuilder.create().uniqueName("measure").buildYamlFile();

      const calcMeasure = YamlCalculatedMeasureBuilder.create().uniqueName("calcMeasure").buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dim1, calcMeasure, measure]);

      expect(validationOutput.hasErrors).toBe(false);
    });
  });

  describe("Verify dimensional attributes", () => {
    const duplicateName = "duplicate_name";

    it("Should not return error if level names are the same in different hierarchies", () => {
      const dimFile = dimensionBuilder
        .addHierarchy({
          unique_name: hierarchy.h_1,
          levels: [{ unique_name: duplicateName }],
        })
        .addHierarchy({
          unique_name: hierarchy.h_2,
          levels: [{ unique_name: duplicateName }],
        })
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dimFile]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should return two errors if level and some attribute names are the same in the same hierarchy", () => {
      const dimFile = dimensionBuilder
        .addHierarchy({
          unique_name: hierarchy.h_1,
          levels: [{ unique_name: duplicateName }],
        })
        .addSecondaryAttribute(getSecondaryAttribute(duplicateName))
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dimFile]);

      const errorInput_1: DimensionalAttribute = {
        unique_name: duplicateName,
        hierarchy: hierarchy.h_1,
        objectType: DuplicateObjType.Level,
        context: {} as IValidationOutputContext,
      };
      const errorInput_2: DimensionalAttribute = {
        ...errorInput_1,
        level: duplicateName,
        objectType: DuplicateObjType.SecondaryAttribute,
      };
      const expectedError_1 = YamlUniquenessErrors.dimAttributesDuplicateUniqueName(errorInput_1);
      const expectedError_2 = YamlUniquenessErrors.dimAttributesDuplicateUniqueName(errorInput_2);

      expect(validationOutput.hasFileErrorMessage(expectedError_1)).toBe(true);
      expect(validationOutput.hasFileErrorMessage(expectedError_2)).toBe(true);
    });

    it("Should return errors for every dimensional attribute duplicated name within the dimension", () => {
      const dimFile = dimensionBuilder
        .addHierarchy({
          unique_name: hierarchy.h_1,
          levels: [{ unique_name: duplicateName, secondary_attributes: [getSecondaryAttribute(duplicateName)] }],
        })
        .addHierarchy({
          unique_name: hierarchy.h_2,
          levels: [{ unique_name: "level_2", aliases: [getSecondaryAttribute(duplicateName)] }],
        })
        .buildYamlFile();

      const validationOutput = uniquenessValidator.validate([dimFile]);

      const errorInput_1: DimensionalAttribute = {
        unique_name: duplicateName,
        hierarchy: hierarchy.h_1,
        objectType: DuplicateObjType.Level,
        context: {} as IValidationOutputContext,
      };
      const errorInput_2: DimensionalAttribute = {
        ...errorInput_1,
        level: duplicateName,
        objectType: DuplicateObjType.SecondaryAttribute,
      };
      const errorInput_3: DimensionalAttribute = {
        unique_name: duplicateName,
        hierarchy: hierarchy.h_2,
        level: "level_2",
        objectType: DuplicateObjType.LevelAlias,
        context: {} as IValidationOutputContext,
      };
      const expectedError_1 = YamlUniquenessErrors.dimAttributesDuplicateUniqueName(errorInput_1);
      const expectedError_2 = YamlUniquenessErrors.dimAttributesDuplicateUniqueName(errorInput_2);
      const expectedError_3 = YamlUniquenessErrors.dimAttributesDuplicateUniqueName(errorInput_3);

      expect(validationOutput.hasFileErrorMessage(expectedError_1)).toBe(true);
      expect(validationOutput.hasFileErrorMessage(expectedError_2)).toBe(true);
      expect(validationOutput.hasFileErrorMessage(expectedError_3)).toBe(true);
    });
  });

  describe("getAllDimensionalAttributes", () => {
    const name = {
      l1: "level_1",
      l2: "level_2",
      sa1: "secAttr_1",
      sa2: "secAttr_2",
      sa3: "secAttr_3",
      alias1: "alias_1",
    };

    it("Should return all the dimensional attributes", () => {
      const dimension = dimensionBuilder
        .addHierarchy({
          unique_name: hierarchy.h_1,
          levels: [{ unique_name: name.l1 }],
        })
        .addSecondaryAttribute(getSecondaryAttribute(name.sa1))
        .addLevelAlias({ unique_name: name.alias1 })
        .addHierarchy({
          unique_name: hierarchy.h_2,
          levels: [
            {
              unique_name: name.l2,
              secondary_attributes: [getSecondaryAttribute(name.sa2)],
            },
            {
              unique_name: name.l1,
              secondary_attributes: [getSecondaryAttribute(name.sa3)],
            },
          ],
        })
        .build();

      const result = uniquenessValidator.getAllDimensionalAttributes(dimension);

      const expectedUniqueNames = result.map((x) => x.unique_name);
      expect(expectedUniqueNames).toEqual([name.l1, name.l2, name.sa1, name.alias1, name.sa2, name.sa3]);
    });

    it("Should return only the first level if referenced in more than one hierarchy", () => {
      const level: IYamlDimensionLevel = { unique_name: name.l1 };
      const dimension = dimensionBuilder
        .addHierarchy({
          unique_name: hierarchy.h_1,
          levels: [level],
        })
        .addHierarchy({
          unique_name: hierarchy.h_2,
          levels: [level],
        })
        .build();

      const result = uniquenessValidator.getAllDimensionalAttributes(dimension);

      const levelAndHierarchyNames = result.map((x) => ({ unique_name: x.unique_name, hierarchy: x.hierarchy }));
      const expected: Partial<DimensionalAttribute> = {
        unique_name: name.l1,
        hierarchy: hierarchy.h_1,
      };
      expect(levelAndHierarchyNames).toEqual([expected]);
    });
  });

  describe("groupModelsAndPerspectivesByUniqueName", () => {
    const uniquenessValidator = YamlUniquenessValidator.create(new YamlErrorContextUtil());
    const uniqueNames = {
      model1: "model1",
      model2: "model2",
      model3: "model3",
      perspective1: "perspective1",
      perspective2: "perspective2",
      perspective3: "perspective3",
    };
    const model1 = YamlModelBuilder.create()
      .uniqueName(uniqueNames.model1)
      .addPerspective({ unique_name: uniqueNames.perspective1 })
      .addPerspective({ unique_name: uniqueNames.perspective2 })
      .buildYamlFile();
    const model2 = YamlModelBuilder.create()
      .uniqueName(uniqueNames.model2)
      .addPerspective({ unique_name: uniqueNames.perspective3 })
      .buildYamlFile();
    const model3 = YamlModelBuilder.create().uniqueName(uniqueNames.model3).buildYamlFile();
    const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [];

    const getKeyFormat = (uniqueName: string) => `["${uniqueName}"]`;

    it("should group models and perspectives by unique name", () => {
      const allModels = [model1, model2, model3];

      const result = uniquenessValidator.groupModelsAndPerspectivesByUniqueName(allModels, yamlParsedFiles);

      expect(result.size).toBe(6);
      expect(result.get(getKeyFormat(uniqueNames.model1))).toEqual([
        { unique_name: uniqueNames.model1, type: YamlPerspectiveModelTypes.MODEL, modelFile: model1 },
      ]);
      expect(result.get(getKeyFormat(uniqueNames.perspective1))).toEqual([
        { unique_name: uniqueNames.perspective1, type: YamlPerspectiveModelTypes.PERSPECTIVE, modelFile: model1 },
      ]);
      expect(result.get(getKeyFormat(uniqueNames.perspective2))).toEqual([
        { unique_name: uniqueNames.perspective2, type: YamlPerspectiveModelTypes.PERSPECTIVE, modelFile: model1 },
      ]);
      expect(result.get(getKeyFormat(uniqueNames.model2))).toEqual([
        { unique_name: uniqueNames.model2, type: YamlPerspectiveModelTypes.MODEL, modelFile: model2 },
      ]);
      expect(result.get(getKeyFormat(uniqueNames.perspective3))).toEqual([
        { unique_name: uniqueNames.perspective3, type: YamlPerspectiveModelTypes.PERSPECTIVE, modelFile: model2 },
      ]);
      expect(result.get(getKeyFormat(uniqueNames.model3))).toEqual([
        { unique_name: uniqueNames.model3, type: YamlPerspectiveModelTypes.MODEL, modelFile: model3 },
      ]);
    });

    it("should handle duplicate unique names", () => {
      const model1 = YamlModelBuilder.create()
        .uniqueName(uniqueNames.model1)
        .addPerspective({ unique_name: uniqueNames.perspective1 })
        .buildYamlFile();
      const model2 = YamlModelBuilder.create()
        .uniqueName(uniqueNames.model1)
        .addPerspective({ unique_name: uniqueNames.perspective1 })
        .buildYamlFile();

      const allModels = [model1, model2];
      const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [];

      const result = uniquenessValidator.groupModelsAndPerspectivesByUniqueName(allModels, yamlParsedFiles);

      expect(result.size).toBe(2);
      expect(result.get(getKeyFormat(uniqueNames.model1))).toEqual([
        { unique_name: uniqueNames.model1, type: YamlPerspectiveModelTypes.MODEL, modelFile: model1 },
        { unique_name: uniqueNames.model1, type: YamlPerspectiveModelTypes.MODEL, modelFile: model2 },
      ]);
      expect(result.get(getKeyFormat(uniqueNames.perspective1))).toEqual([
        { unique_name: uniqueNames.perspective1, type: YamlPerspectiveModelTypes.PERSPECTIVE, modelFile: model1 },
        { unique_name: uniqueNames.perspective1, type: YamlPerspectiveModelTypes.PERSPECTIVE, modelFile: model2 },
      ]);
    });

    it("should handle no perspectives", () => {
      const model1 = YamlModelBuilder.create().uniqueName(uniqueNames.model1).buildYamlFile();
      const model2 = YamlModelBuilder.create().uniqueName(uniqueNames.model2).buildYamlFile();

      const allModels = [model1, model2];
      const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [];

      const result = uniquenessValidator.groupModelsAndPerspectivesByUniqueName(allModels, yamlParsedFiles);

      expect(result.size).toBe(2);
      expect(result.get(getKeyFormat(uniqueNames.model1))).toEqual([
        { unique_name: uniqueNames.model1, type: YamlPerspectiveModelTypes.MODEL, modelFile: model1 },
      ]);
      expect(result.get(getKeyFormat(uniqueNames.model2))).toEqual([
        { unique_name: uniqueNames.model2, type: YamlPerspectiveModelTypes.MODEL, modelFile: model2 },
      ]);
    });
  });

  describe("validateModelPerspectiveUniqueNames", () => {
    const uniquenessValidator = YamlUniquenessValidator.create(new YamlErrorContextUtil());
    const uniqueNames = {
      model1: "model1",
      model2: "model2",
      perspective1: "perspective1",
      perspective2: "perspective2",
    };

    it("should not return errors if all model and perspective unique names are unique", () => {
      const model1 = YamlModelBuilder.create()
        .uniqueName(uniqueNames.model1)
        .addPerspective({ unique_name: uniqueNames.perspective1 })
        .buildYamlFile();
      const model2 = YamlModelBuilder.create()
        .uniqueName(uniqueNames.model2)
        .addPerspective({ unique_name: uniqueNames.perspective2 })
        .buildYamlFile();

      const yamlParsedFiles = [model1, model2];
      const validatorOutput = ValidatorOutput.create();

      uniquenessValidator.validateModelPerspectiveUniqueNames(yamlParsedFiles, validatorOutput);

      expect(validatorOutput.hasErrors).toBe(false);
    });

    /*
    The case where only models have duplicated unique names is covered by the validation for file names.
    To avoid repeating messages, an error is only added if a perspective is involved.
    */
    it("should not return errors if there are duplicate model unique names", () => {
      const model1 = YamlModelBuilder.create()
        .uniqueName(uniqueNames.model1)
        .addPerspective({ unique_name: uniqueNames.perspective1 })
        .buildYamlFile();
      const model2 = YamlModelBuilder.create()
        .uniqueName(uniqueNames.model1)
        .addPerspective({ unique_name: uniqueNames.perspective2 })
        .buildYamlFile();

      const yamlParsedFiles = [model1, model2];
      const validatorOutput = ValidatorOutput.create();

      uniquenessValidator.validateModelPerspectiveUniqueNames(yamlParsedFiles, validatorOutput);

      expect(validatorOutput.hasErrors).toBe(false);
      expect(validatorOutput.getFilesWithErrors()).toHaveLength(0);
    });

    it("should return errors if there are duplicate perspective unique names", () => {
      const model1 = YamlModelBuilder.create()
        .uniqueName(uniqueNames.model1)
        .addPerspective({ unique_name: uniqueNames.perspective1 })
        .buildYamlFile();
      const model2 = YamlModelBuilder.create()
        .uniqueName(uniqueNames.model2)
        .addPerspective({ unique_name: uniqueNames.perspective1 })
        .buildYamlFile();

      const yamlParsedFiles = [model1, model2];
      const validatorOutput = ValidatorOutput.create();

      uniquenessValidator.validateModelPerspectiveUniqueNames(yamlParsedFiles, validatorOutput);

      expect(validatorOutput.hasErrors).toBe(true);
      expect(validatorOutput.getFilesWithErrors()).toHaveLength(2);
    });

    it("should return errors if there are duplicate model and perspective unique names", () => {
      const model1 = YamlModelBuilder.create()
        .uniqueName(uniqueNames.model1)
        .addPerspective({ unique_name: uniqueNames.perspective1 })
        .buildYamlFile();
      const model2 = YamlModelBuilder.create()
        .uniqueName(uniqueNames.model1)
        .addPerspective({ unique_name: uniqueNames.perspective1 })
        .buildYamlFile();

      const yamlParsedFiles = [model1, model2];
      const validatorOutput = ValidatorOutput.create();

      uniquenessValidator.validateModelPerspectiveUniqueNames(yamlParsedFiles, validatorOutput);

      expect(validatorOutput.hasErrors).toBe(true);
      expect(validatorOutput.getFilesWithErrors()).toHaveLength(1);
    });

    it("should not return errors if there are no models or perspectives", () => {
      const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [];
      const validatorOutput = ValidatorOutput.create();

      uniquenessValidator.validateModelPerspectiveUniqueNames(yamlParsedFiles, validatorOutput);

      expect(validatorOutput.hasErrors).toBe(false);
    });
  });
});
