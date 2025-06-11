import YamlCompositeModelBuilder from "models/src/builders/YamlObjectBuilders/YamlCompositeModelBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import YamlModelRelationBuilder from "models/src/builders/YamlObjectBuilders/YamlModelRelationBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlModel } from "models/src/yaml/IYamlModel";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import { convertCompositeModels } from "./composite-model.util";

const COMPOSITE_MODEL_NAME = "composite_model_unique_name";
const METRIC1 = "metric1";
const METRIC2 = "metric2";
const METRIC3 = "metric3";
const DIMENSION1 = "dimension1";
const DIMENSION2 = "dimension2";
const MODEL1_NAME = "model1";
const MODEL2_NAME = "model2";
const RELATION1 = "relation1";
const RELATION2 = "relation2";

type YamlObjectBuilder = YamlModelBuilder | YamlModelRelationBuilder | YamlCompositeModelBuilder;

const createParsedFile = (builder: YamlObjectBuilder): IYamlParsedFile => ({
  compilationOutput: [],
  data: builder.build() as IYamlObject,
  rawContent: "",
  relativePath: "path/to/file.yaml",
});

const getParsedFiles = (...builders: Array<YamlObjectBuilder>): Array<IYamlParsedFile> =>
  builders.map(createParsedFile);

describe("convertCompositeModels", () => {
  it("should convert a composite model into a regular model", () => {
    const compositeModelBuilder = YamlCompositeModelBuilder.create()
      .with({
        unique_name: COMPOSITE_MODEL_NAME,
        models: [MODEL1_NAME, MODEL2_NAME],
      })
      .addMetric(METRIC1);

    const relationship1 = YamlModelRelationBuilder.create().withName(RELATION1).build();
    const relationship2 = YamlModelRelationBuilder.create().withName(RELATION2).build();

    const model1Builder = YamlModelBuilder.create()
      .with({
        unique_name: MODEL1_NAME,
        dimensions: [DIMENSION1],
      })
      .addMetric(METRIC2)
      .withRelationships([relationship1]);

    const model2Builder = YamlModelBuilder.create()
      .with({
        unique_name: MODEL2_NAME,
        dimensions: [DIMENSION2],
      })
      .addMetric(METRIC3)
      .withRelationships([relationship2]);

    let allFiles = getParsedFiles(compositeModelBuilder, model1Builder, model2Builder);

    allFiles = convertCompositeModels(allFiles);

    const convertedModel = allFiles.find((file) => file.data.unique_name === COMPOSITE_MODEL_NAME)?.data as IYamlModel;

    expect(convertedModel.object_type).toBe(ObjectType.Model);
    expect(convertedModel.unique_name).toBe(COMPOSITE_MODEL_NAME);
    expect(convertedModel.metrics).toEqual([
      { unique_name: METRIC1 },
      { unique_name: METRIC2 },
      { unique_name: METRIC3 },
    ]);
    expect(convertedModel.dimensions).toEqual([DIMENSION1, DIMENSION2]);
    expect(convertedModel.relationships).toEqual([relationship1, relationship2]);
  });

  it("should return the original files if there are no composite models", () => {
    const model1Builder = YamlModelBuilder.create()
      .with({
        unique_name: MODEL1_NAME,
        dimensions: [DIMENSION1],
      })
      .addMetric(METRIC2);

    const model2Builder = YamlModelBuilder.create()
      .with({
        unique_name: MODEL2_NAME,
        dimensions: [DIMENSION2],
      })
      .addMetric(METRIC3);

    const allFiles = getParsedFiles(model1Builder, model2Builder);

    const result = convertCompositeModels(allFiles);

    expect(result).toEqual(allFiles);
  });

  it("should throw an error if a referenced inner model does not exist", () => {
    const compositeModelBuilder = YamlCompositeModelBuilder.create()
      .with({
        unique_name: COMPOSITE_MODEL_NAME,
        models: [MODEL1_NAME, "non_existent_model"],
      })
      .addMetric(METRIC1);

    const model1Builder = YamlModelBuilder.create()
      .with({
        unique_name: MODEL1_NAME,
        dimensions: [DIMENSION1],
      })
      .addMetric(METRIC2);

    const allFiles = getParsedFiles(compositeModelBuilder, model1Builder);

    expect(() => convertCompositeModels(allFiles)).toThrowError(`No object found with unique name non_existent_model`);
  });

  it("should correctly handle a composite model with no inner models", () => {
    const compositeModelBuilder = YamlCompositeModelBuilder.create()
      .with({
        unique_name: COMPOSITE_MODEL_NAME,
        models: [],
      })
      .addMetric(METRIC1);

    const allFiles = getParsedFiles(compositeModelBuilder);

    const result = convertCompositeModels(allFiles);

    const convertedModel = result.find((file) => file.data.unique_name === COMPOSITE_MODEL_NAME)?.data as IYamlModel;

    expect(convertedModel.object_type).toBe(ObjectType.Model);
    expect(convertedModel.metrics).toEqual([{ unique_name: METRIC1 }]);
    expect(convertedModel.dimensions).toBeUndefined();
    expect(convertedModel.relationships).toEqual([]);
    expect(convertedModel.overrides).toBeUndefined();
  });

  it("should correctly merge overrides from inner models", () => {
    const compositeModelBuilder = YamlCompositeModelBuilder.create()
      .with({
        unique_name: COMPOSITE_MODEL_NAME,
        models: [MODEL1_NAME, MODEL2_NAME],
      })
      .addMetric(METRIC1);

    const model1Builder = YamlModelBuilder.create()
      .with({
        unique_name: MODEL1_NAME,
        overrides: { override1: { query_name: "query1" } },
      })
      .addMetric(METRIC2);

    const model2Builder = YamlModelBuilder.create()
      .with({
        unique_name: MODEL2_NAME,
        overrides: { override2: { query_name: "query2" } },
      })
      .addMetric(METRIC3);

    const allFiles = getParsedFiles(compositeModelBuilder, model1Builder, model2Builder);

    const result = convertCompositeModels(allFiles);

    const convertedModel = result.find((file) => file.data.unique_name === COMPOSITE_MODEL_NAME)?.data as IYamlModel;

    expect(convertedModel.overrides).toEqual({
      override1: { query_name: "query1" },
      override2: { query_name: "query2" },
    });
  });
});
