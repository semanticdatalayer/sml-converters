import YamlConnectionBuilder from "models/src/builders/YamlObjectBuilders/YamlConnectionBuilder";
import YamlDatasetBuilder from "models/src/builders/YamlObjectBuilders/YamlDatasetBuilder";
import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import { YamlObjectBuilder } from "models/src/builders/YamlObjectBuilders/YamlObjectBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlDataset } from "models/src/yaml/IYamlDataset";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import YamlCommonReferenceValidator, { yamlCommonReferenceMessages } from "./YamlCommonReferenceValidator";

// TODO Refactor test and builders
const buildElementsMap = (...elements: Array<IYamlParsedFile>): Map<string, IYamlParsedFile> => {
  const elementsMap = new Map<string, IYamlParsedFile>();
  elements.forEach((e) => {
    elementsMap.set(e.data.unique_name, e);
  });

  return elementsMap;
};
const buildersWithRelationships = ({
  dimDatasetName = "dataset1",
  dimJoinColumn = "column1",
  rightDimName = "dimension1",
  dimAttribute = "attribute1",
}): Array<YamlObjectBuilder<IYamlObject, AnyObjectBuilder<IYamlObject>>> => {
  const dimensionOne = YamlDimensionBuilder.create().addRelationship({
    from: { dataset: dimDatasetName, join_columns: [dimJoinColumn] },
    to: { dimension: rightDimName, level: dimAttribute },
    type: undefined,
  });
  const dimensionTwo = YamlDimensionBuilder.create()
    .addAttribute({ unique_name: "attribute1", key_columns: ["column1"] })
    .uniqueName("dimension1");
  const dataset = YamlDatasetBuilder.create().uniqueName("dataset1").addColumn("column1");

  return [dimensionOne, dimensionTwo, dataset];
};
const yamlCommonReferenceValidator = new YamlCommonReferenceValidator();
const datasetBuilder = YamlDatasetBuilder.create();
const connection = YamlConnectionBuilder.create().with({ unique_name: "connection1" }).buildYamlFile();

let datasetYamlFile: IYamlParsedFile<IYamlDataset> = datasetBuilder
  .with({ connection_id: "connection1" })
  .buildYamlFile();
let referencedObjectIds = new Set<string>();

describe("YamlCommonReferenceValidator", () => {
  describe("validateAndGetReferencedObject", () => {
    beforeEach(() => {
      datasetYamlFile = datasetBuilder.with({ connection_id: "connection1" }).buildYamlFile();
    });

    it("Should return reference object if there is a connection with the same name", () => {
      const referencedUniqueName = datasetYamlFile.data.connection_id;
      const validatorOutput = ValidatorOutput.create();
      const result = yamlCommonReferenceValidator.validateAndGetReferencedObject(
        referencedUniqueName,
        buildElementsMap(connection),
        datasetYamlFile,
        ObjectType.Connection,
        validatorOutput
      );

      expect(validatorOutput.hasErrors).toBe(false);
      expect(result?.relativePath).toBe(connection.relativePath);
    });

    it("Should add an error if there is no connection with the same uniqueName", () => {
      const defaultConnection = YamlConnectionBuilder.create().buildYamlFile();
      const validatorOutput = ValidatorOutput.create();

      const referencedObject = yamlCommonReferenceValidator.validateAndGetReferencedObject(
        datasetYamlFile.data.connection_id,
        buildElementsMap(defaultConnection),
        datasetYamlFile,
        ObjectType.Connection,
        validatorOutput
      );

      expect(validatorOutput.hasErrors).toBe(true);
      expect(referencedObject).toBeUndefined();
    });

    it("Should add an error if there is file with the same connection name but with a different object type", () => {
      const datasetWithConnectionName = datasetBuilder.uniqueName("connection1").buildYamlFile();
      const validatorOutput = ValidatorOutput.create();

      const referencedObject = yamlCommonReferenceValidator.validateAndGetReferencedObject(
        datasetYamlFile.data.connection_id,
        buildElementsMap(datasetWithConnectionName),
        datasetYamlFile,
        ObjectType.Connection,
        validatorOutput
      );

      expect(validatorOutput.hasErrors).toBe(true);
      expect(referencedObject).toBeUndefined();
    });
  });

  describe("validateRelationships", () => {
    beforeEach(() => {
      referencedObjectIds = new Set<string>();
    });

    it("Should add referenced objects to the collection", async () => {
      const yamlFiles = buildersWithRelationships({}).map((b) => b.buildYamlFile());
      const dimensionYamlFile = yamlFiles[0];

      const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
        dimensionYamlFile,
        buildElementsMap(...yamlFiles),
        referencedObjectIds
      );
      expect(validatorOutput.hasErrors).toBe(false);
      expect(referencedObjectIds).toContain(yamlFiles[1].data.unique_name);
      expect(referencedObjectIds).toContain(yamlFiles[2].data.unique_name);
    });

    it("Should show warning if dataset is detached", () => {
      const yamlFiles = buildersWithRelationships({ dimDatasetName: "" }).map((b) => b.buildYamlFile());
      const dimensionYamlFile = yamlFiles[0];

      const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
        dimensionYamlFile,
        buildElementsMap(...yamlFiles),
        referencedObjectIds
      );

      expect(
        validatorOutput.hasFileWarningMessage(
          yamlCommonReferenceMessages.detachedRelationships(dimensionYamlFile.data.unique_name, ObjectType.Dataset)
        )
      ).toBe(true);
    });

    it("Should show warning if dimension is detached", () => {
      const yamlFiles = buildersWithRelationships({ rightDimName: "" }).map((b) => b.buildYamlFile());
      const dimensionYamlFile = yamlFiles[0];

      const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
        dimensionYamlFile,
        buildElementsMap(...yamlFiles),
        referencedObjectIds
      );

      expect(
        validatorOutput.hasFileWarningMessage(
          yamlCommonReferenceMessages.detachedRelationships(dimensionYamlFile.data.unique_name, ObjectType.Dimension)
        )
      ).toBe(true);
    });

    it.each([
      ["dataset name(left part)", "dimDatasetName", "invalid"],
      ["join column(left part)", "dimJoinColumn", ["invalid"]],
      ["attribute(right part)", "dimAttribute", "invalid"],
      ["dimension(right part)", "rightDimName", "invalid"],
    ])("validates dimension with non-existing %s", (description, propertyName, propertyValue) => {
      const yamlFiles = buildersWithRelationships({ [propertyName]: propertyValue }).map((b) => b.buildYamlFile());
      const dimensionYamlFile = yamlFiles[0];

      const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
        dimensionYamlFile,
        buildElementsMap(...yamlFiles),
        referencedObjectIds
      );

      expect(validatorOutput.hasErrors).toBe(true);
    });

    describe("Relation keys mismatch validation", () => {
      const dataset = YamlDatasetBuilder.create()
        .uniqueName("dataset")
        .addColumn("column1")
        .addColumn("column2")
        .buildYamlFile();

      const dimension = YamlDimensionBuilder.create()
        .uniqueName("dimension")
        .addAttribute({
          unique_name: "attribute",
          key_columns: ["column1", "column2"],
        })
        .buildYamlFile();

      describe("For models", () => {
        it("Should not show error if join_columns are the same number as key_columns", () => {
          const model = YamlModelBuilder.create()
            .addRelationship({
              from: {
                dataset: dataset.data.unique_name,
                join_columns: ["column1", "column2"],
              },
              to: {
                dimension: dimension.data.unique_name,
                level: dimension.data.level_attributes[0].unique_name,
              },
            })
            .buildYamlFile();

          const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
            model,
            buildElementsMap(dataset, dimension, model),
            referencedObjectIds
          );

          expect(validatorOutput.hasErrors).toBe(false);
        });

        it("Should not show error if join_columns are the same number as key_columns, but with different names", () => {
          const dataset = YamlDatasetBuilder.create()
            .uniqueName("dataset")
            .addColumn("columnName1")
            .addColumn("columnName2")
            .buildYamlFile();

          const model = YamlModelBuilder.create()
            .addRelationship({
              from: {
                dataset: dataset.data.unique_name,
                join_columns: ["columnName1", "columnName2"],
              },
              to: {
                dimension: dimension.data.unique_name,
                level: dimension.data.level_attributes[0].unique_name,
              },
            })
            .buildYamlFile();

          const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
            model,
            buildElementsMap(dataset, dimension, model),
            referencedObjectIds
          );

          expect(validatorOutput.hasErrors).toBe(false);
        });

        it("Should show error if join_columns are less than the key_columns", () => {
          const model = YamlModelBuilder.create()
            .addRelationship({
              from: {
                dataset: dataset.data.unique_name,
                join_columns: ["column1"],
              },
              to: {
                dimension: dimension.data.unique_name,
                level: dimension.data.level_attributes[0].unique_name,
              },
            })
            .buildYamlFile();

          const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
            model,
            buildElementsMap(dataset, dimension, model),
            referencedObjectIds
          );

          expect(validatorOutput.hasErrors).toBe(true);
        });

        it("Should show error if join_columns are more than the key_columns", () => {
          const model = YamlModelBuilder.create()
            .addRelationship({
              from: {
                dataset: dataset.data.unique_name,
                join_columns: ["column1", "column2", "column3"],
              },
              to: {
                dimension: dimension.data.unique_name,
                level: dimension.data.level_attributes[0].unique_name,
              },
            })
            .buildYamlFile();

          const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
            model,
            buildElementsMap(dataset, dimension, model),
            referencedObjectIds
          );

          expect(validatorOutput.hasErrors).toBe(true);
        });
      });

      describe("For embedded dimensions", () => {
        it("Should not show error if join_columns are the same as key_columns", () => {
          const dimensionTwo = YamlDimensionBuilder.create()
            .addRelationship({
              from: {
                dataset: dataset.data.unique_name,
                join_columns: ["column1", "column2"],
              },
              to: {
                dimension: dimension.data.unique_name,
                level: dimension.data.level_attributes[0].unique_name,
              },
              type: undefined,
            })
            .buildYamlFile();

          const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
            dimensionTwo,
            buildElementsMap(dataset, dimension, dimensionTwo),
            referencedObjectIds
          );

          expect(validatorOutput.hasErrors).toBe(false);
        });

        it("Should not show error if join_columns are the same number as key_columns, but with different names", () => {
          const dataset = YamlDatasetBuilder.create()
            .uniqueName("dataset")
            .addColumn("columnName1")
            .addColumn("columnName2")
            .buildYamlFile();

          const dimensionTwo = YamlDimensionBuilder.create()
            .addRelationship({
              from: {
                dataset: dataset.data.unique_name,
                join_columns: ["columnName1", "columnName2"],
              },
              to: {
                dimension: dimension.data.unique_name,
                level: dimension.data.level_attributes[0].unique_name,
              },
              type: undefined,
            })
            .buildYamlFile();

          const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
            dimensionTwo,
            buildElementsMap(dataset, dimension, dimensionTwo),
            referencedObjectIds
          );

          expect(validatorOutput.hasErrors).toBe(false);
        });

        it("Should show error if join_columns are less than the key_columns", () => {
          const dimensionTwo = YamlDimensionBuilder.create()
            .addRelationship({
              from: {
                dataset: dataset.data.unique_name,
                join_columns: ["column1"],
              },
              to: {
                dimension: dimension.data.unique_name,
                level: dimension.data.level_attributes[0].unique_name,
              },
              type: undefined,
            })
            .buildYamlFile();

          const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
            dimensionTwo,
            buildElementsMap(dataset, dimension, dimensionTwo),
            referencedObjectIds
          );

          expect(validatorOutput.hasErrors).toBe(true);
        });

        it("Should show error if join_columns are more than the key_columns", () => {
          const dimensionTwo = YamlDimensionBuilder.create()
            .addRelationship({
              from: {
                dataset: dataset.data.unique_name,
                join_columns: ["column1", "column2", "column3"],
              },
              to: {
                dimension: dimension.data.unique_name,
                level: dimension.data.level_attributes[0].unique_name,
              },
              type: undefined,
            })
            .buildYamlFile();

          const validatorOutput = yamlCommonReferenceValidator.validateRelationships(
            dimensionTwo,
            buildElementsMap(dataset, dimension, dimensionTwo),
            referencedObjectIds
          );

          expect(validatorOutput.hasErrors).toBe(true);
        });
      });
    });
  });

  describe("validateAttributesReferences", () => {
    let validatorOutput: ValidatorOutput;
    const model = YamlModelBuilder.create().buildYamlFile();

    const attribute = { dimension: "mockDim", name: "mockAttribute" };
    beforeEach(() => {
      validatorOutput = ValidatorOutput.create();
    });
    it("Should call validateAndGetReferencedObject", () => {
      const spyOn = jest.spyOn(yamlCommonReferenceValidator, "validateAndGetReferencedObject");
      yamlCommonReferenceValidator.validateAttributesReferences(validatorOutput, model, buildElementsMap(), [
        attribute,
      ]);

      expect(spyOn).toBeCalled();
    });

    it("Should throw an error if level does't exist", () => {
      const dimension = YamlDimensionBuilder.create()
        .uniqueName(attribute.dimension)
        .addLevelAttribute()
        .buildYamlFileForPackage();

      yamlCommonReferenceValidator.validateAttributesReferences(validatorOutput, model, buildElementsMap(dimension), [
        attribute,
      ]);

      expect(validatorOutput.hasErrors).toBe(true);
    });

    it("Should NOT throw error if 'name' is secondary attribute", () => {
      const secondaryAttribute = "secondaryAttribute";
      const dimension = YamlDimensionBuilder.create()
        .uniqueName(attribute.dimension)
        .addHierarchy()
        .addSecondaryAttribute({ unique_name: secondaryAttribute })
        .buildYamlFileForPackage();

      yamlCommonReferenceValidator.validateAttributesReferences(validatorOutput, model, buildElementsMap(dimension), [
        { dimension: attribute.dimension, name: secondaryAttribute },
      ]);

      expect(validatorOutput.hasErrors).toBe(false);
    });
  });

  describe("validateMetricsReferences", () => {
    it("Should throw an error if metric doesn't exist", () => {
      const metricReference = "metricReference";
      const measure = YamlMeasureBuilder.create().buildYamlFileForPackage();
      const validatorOutput = ValidatorOutput.create();
      const model = YamlModelBuilder.create().buildYamlFile();

      yamlCommonReferenceValidator.validateMetricReferences(validatorOutput, model, buildElementsMap(measure), [
        metricReference,
      ]);

      expect(validatorOutput.hasErrors).toBe(true);
    });
  });
});
