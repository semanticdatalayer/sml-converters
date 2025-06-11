import YamlCompositeModelBuilder from "../../builders/YamlObjectBuilders/YamlCompositeModelBuilder";
import YamlDimensionBuilder from "../../builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlMeasureBuilder from "../../builders/YamlObjectBuilders/YamlMeasureBuilder";
import YamlModelBuilder from "../../builders/YamlObjectBuilders/YamlModelBuilder";
import IYamlParsedFile from "../../IYamlParsedFile";
import { IYamlObject } from "../IYamlObject";
import { getAllDimensions, getAllModels, getAllParsedItems } from "./YamlParsedFilesUtil";

const uniqueNames = {
  model1: "model1",
  model2: "model2",
  compositeModel1: "compositeModel1",
  perspective1: "perspective1",
  perspective2: "perspective2",
  dimension1: "dimension1",
  dimension2: "dimension2",
  measure1: "measure1",
  measure2: "measure2",
};
const model1 = YamlModelBuilder.create()
  .uniqueName(uniqueNames.model1)
  .addPerspective({ unique_name: uniqueNames.perspective1 })
  .buildYamlFile();
const model2 = YamlModelBuilder.create()
  .uniqueName(uniqueNames.model2)
  .addPerspective({ unique_name: uniqueNames.perspective2 })
  .buildYamlFile();
const compositeModel1 = YamlCompositeModelBuilder.create().uniqueName(uniqueNames.compositeModel1).buildYamlFile();
const dimension1 = YamlDimensionBuilder.create().uniqueName(uniqueNames.dimension1).buildYamlFile();
const dimension2 = YamlDimensionBuilder.create().uniqueName(uniqueNames.dimension2).buildYamlFile();

const measure1 = YamlMeasureBuilder.create().uniqueName(uniqueNames.measure1).buildYamlFile();

describe("YamlParsedFilesUtil", () => {
  describe("getAllModels", () => {
    it("should return only files that are models or composite models", () => {
      const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [model1, model2, compositeModel1, dimension1, measure1];

      const result = getAllModels(yamlParsedFiles);

      expect(result).toHaveLength(3);
      expect(result[0].data.unique_name).toBe(uniqueNames.model1);
      expect(result[1].data.unique_name).toBe(uniqueNames.model2);
      expect(result[2].data.unique_name).toBe(uniqueNames.compositeModel1);
    });

    it("should return an empty array if no models or composite models are found", () => {
      const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [dimension1, measure1];

      const result = getAllModels(yamlParsedFiles);

      expect(result).toHaveLength(0);
    });
  });

  describe("getAllDimensions", () => {
    it("should return only files that are dimensions", () => {
      const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [model1, dimension1, dimension2, measure1];

      const result = getAllDimensions(yamlParsedFiles);

      expect(result).toHaveLength(2);
      expect(result[0].data.unique_name).toBe(uniqueNames.dimension1);
      expect(result[1].data.unique_name).toBe(uniqueNames.dimension2);
    });

    it("should return an empty array if no dimensions are found", () => {
      const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [model1, measure1];

      const result = getAllDimensions(yamlParsedFiles);

      expect(result).toHaveLength(0);
    });
  });

  describe("getAllItems", () => {
    it("should return a map of all items with their unique names as keys", () => {
      const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [model1, model2, compositeModel1, dimension1, measure1];

      const result = getAllParsedItems(yamlParsedFiles);

      expect(result.size).toBe(5);
      expect(result.get(uniqueNames.model1)).toBe(model1);
      expect(result.get(uniqueNames.model2)).toBe(model2);
      expect(result.get(uniqueNames.compositeModel1)).toBe(compositeModel1);
      expect(result.get(uniqueNames.dimension1)).toBe(dimension1);
      expect(result.get(uniqueNames.measure1)).toBe(measure1);
    });

    it("should return an empty map if no items are provided", () => {
      const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [];

      const result = getAllParsedItems(yamlParsedFiles);

      expect(result.size).toBe(0);
    });
  });
});
