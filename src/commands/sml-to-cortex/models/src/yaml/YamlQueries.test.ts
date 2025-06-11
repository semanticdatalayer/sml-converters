import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import YamlConnectionBuilder from "../builders/YamlObjectBuilders/YamlConnectionBuilder";
import YamlDatasetBuilder from "../builders/YamlObjectBuilders/YamlDatasetBuilder";
import YamlDimensionBuilder from "../builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlMeasureBuilder from "../builders/YamlObjectBuilders/YamlMeasureBuilder";
import YamlModelBuilder from "../builders/YamlObjectBuilders/YamlModelBuilder";
import YamlModelRelationBuilder from "../builders/YamlObjectBuilders/YamlModelRelationBuilder";
import YamlRowSecurityBuilder from "../builders/YamlObjectBuilders/YamlRowSecurityBuilder";
import IYamlParsedFile from "../IYamlParsedFile";
import {
  IYamlDimension,
  IYamlDimensionType,
  IYamlEmbeddedRelationship,
  YamlDimensionRelationType,
} from "./IYamlDimension";
import { IYamlModel } from "./IYamlModel";
import { IYamlObject } from "./IYamlObject";
import { IRepoObjectsIndex, YamlQueries } from "./YamlQueries";

class YamlQueriesExposed extends YamlQueries {
  public getModelDatasetsUniqueNamesUsedInAnyChildObject(model: IYamlModel, allObjects: IRepoObjectsIndex): string[] {
    return super.getModelDatasetsUniqueNamesUsedInAnyChildObject(model, allObjects);
  }
}

const yamlQueries = new YamlQueriesExposed();
const modelBuilder = YamlModelBuilder.create();
const parsedFile = (builder: AnyObjectBuilder<IYamlObject>): IYamlParsedFile => {
  return {
    compilationOutput: [],
    data: builder.build(),
    rawContent: "",
    relativePath: "test path",
  };
};

const getInputs = (...builders: Array<AnyObjectBuilder<IYamlObject>>): Array<IYamlParsedFile> => {
  return builders.map(parsedFile);
};

const getRelationshipTo = (dimensionName: string): IYamlEmbeddedRelationship => {
  return {
    from: {
      dataset: "mockValue",
      join_columns: ["mockValue"],
      hierarchy: "mockSourceHierarchy",
      level: "mockSourceLevel",
    },
    to: {
      dimension: dimensionName,
      level: "mockValue",
    },
    unique_name: "mockUniqueName",
    type: YamlDimensionRelationType.Embedded,
  };
};

const getRepoObjectIndex = (objBuilders: Array<AnyObjectBuilder<IYamlObject>>): IRepoObjectsIndex => {
  const allFiles = objBuilders.map(parsedFile);
  return yamlQueries.sortYamlModels(allFiles);
};

const yamlDimensionBuilder = YamlDimensionBuilder.create();
const parentDim = yamlDimensionBuilder.uniqueName("parrent").addRelationship(getRelationshipTo("child")).build();

const dimensionsIndex = new Map([[parentDim.unique_name, parentDim]]);

const clearDimIndexKeys = (keys: Array<string>): void => {
  keys.forEach((k) => dimensionsIndex.delete(k));
};

const setUpChildOfChild = () => {
  const childDimension = yamlDimensionBuilder
    .with({ unique_name: "child" })
    .addRelationship(getRelationshipTo("childOfChild"))
    .build();
  const childOfChild = yamlDimensionBuilder.with({ unique_name: "childOfChild" }).build();
  dimensionsIndex.set(childOfChild.unique_name, childOfChild);
  dimensionsIndex.set(childDimension.unique_name, childDimension);

  return {
    childDimension,
    childOfChild,
  };
};

const dimension = "dimension";
const modelOne = "model1";
const levelOne = "level1";

describe("YamlQueries", () => {
  describe("addEmbeddedDimensions", () => {
    it("Should get embedded Dimensions if they exist", () => {
      const childDimension = yamlDimensionBuilder.with({ unique_name: "child" }).build();
      dimensionsIndex.set(childDimension.unique_name, childDimension);
      const modelDimensions: Array<IYamlDimension> = [];

      yamlQueries.addEmbeddedDimensions(dimensionsIndex, parentDim, modelDimensions);

      expect(modelDimensions).toHaveLength(1);

      clearDimIndexKeys([childDimension.unique_name]);
    });

    it("Should call recursively addEmbeddedDimensions if children dimensions are embedded", () => {
      const { childDimension, childOfChild } = setUpChildOfChild();
      const func = jest.spyOn(yamlQueries, "addEmbeddedDimensions");

      yamlQueries.addEmbeddedDimensions(dimensionsIndex, parentDim, []);

      expect(func).toBeCalledTimes(3);

      clearDimIndexKeys([childDimension.unique_name, childOfChild.unique_name]);
    });

    it("Should return all children", () => {
      const { childDimension, childOfChild } = setUpChildOfChild();
      const modelDimensions: Array<IYamlDimension> = [];

      yamlQueries.addEmbeddedDimensions(dimensionsIndex, parentDim, modelDimensions);

      expect(modelDimensions).toHaveLength(2);

      clearDimIndexKeys([childDimension.unique_name, childOfChild.unique_name]);
    });

    it("Should not add dimension if already exist", () => {
      const { childDimension, childOfChild } = setUpChildOfChild();
      const modelDimensions: Array<IYamlDimension> = [childOfChild];

      yamlQueries.addEmbeddedDimensions(dimensionsIndex, parentDim, modelDimensions);

      expect(modelDimensions).toHaveLength(2);

      clearDimIndexKeys([childDimension.unique_name, childOfChild.unique_name]);
    });
  });

  describe("getYamlFilesWithoutDetachedRelationships", () => {
    it("Should return all relationships, if there are no detached datasets or dimensions", () => {
      const input = getInputs(modelBuilder.with({ unique_name: "test" }).addRelationship());
      const result = yamlQueries.getYamlFilesWithoutDetachedRelationships(input);

      expect((result[0].data as IYamlModel).relationships?.length).toBe(
        (input[0].data as IYamlModel).relationships.length
      );
    });

    it("Should skip detached relationships", () => {
      const input = getInputs(
        modelBuilder.with({ unique_name: "test" }).addRelationship({ from: { dataset: "", join_columns: [] } })
      );
      const result = yamlQueries.getYamlFilesWithoutDetachedRelationships(input);

      expect((result[0].data as IYamlModel).relationships?.length).toBe(0);
    });
  });

  describe("YamlQueries.getCatalogUsedDimensions", () => {
    it("Should not return results, if there are no relationships", () => {
      const dimensionMock1 = yamlDimensionBuilder.with({ unique_name: "dimMock1" }).buildYamlFile();
      const modelMock = modelBuilder.buildYamlFile();

      const result = yamlQueries.getCatalogUsedDimensions([modelMock, dimensionMock1]);
      expect(result).toHaveLength(0);
    });

    it("Should return all used dimensions, if there are relationships pointed to them", () => {
      const dimensionMock1 = yamlDimensionBuilder.with({ unique_name: "dimMock1" }).buildYamlFile();
      const dimensionMock2 = yamlDimensionBuilder.with({ unique_name: "dimMock2" }).addRelationship().buildYamlFile();
      const modelMock = modelBuilder
        .addRelationship({
          to: {
            dimension: dimensionMock1.data.unique_name,
            level: "",
          },
        })
        .buildYamlFile();

      const result = yamlQueries.getCatalogUsedDimensions([modelMock, dimensionMock1, dimensionMock2]);
      expect(result).toHaveLength(1);
    });

    it("Should return all used dimensions and embedded dimensions", () => {
      const dimensionMock2 = yamlDimensionBuilder.with({ unique_name: "dimMock2" }).buildYamlFile();
      const dimensionMock1 = yamlDimensionBuilder
        .with({ unique_name: "dimMock1" })
        .addOrphanDimension(dimensionMock2.data.unique_name)
        .buildYamlFile();
      const modelMock = modelBuilder
        .addRelationship({
          to: {
            dimension: dimensionMock1.data.unique_name,
            level: "",
          },
        })
        .buildYamlFile();

      const result = yamlQueries.getCatalogUsedDimensions([modelMock, dimensionMock1, dimensionMock2]);
      expect(result).toHaveLength(2);
    });

    it("Should return all used dimensions once, if they are used in different models", () => {
      const dimensionMock1 = yamlDimensionBuilder.with({ unique_name: "dimMock1" }).buildYamlFile();
      const modelMock1 = modelBuilder
        .addRelationship({
          to: {
            dimension: dimensionMock1.data.unique_name,
            level: "",
          },
        })
        .buildYamlFile();

      const modelMock2 = modelBuilder
        .with({ unique_name: "mockModelName" })
        .addRelationship({
          to: {
            dimension: dimensionMock1.data.unique_name,
            level: "",
          },
        })
        .buildYamlFile();

      const result = yamlQueries.getCatalogUsedDimensions([modelMock1, modelMock2, dimensionMock1]);
      expect(result).toHaveLength(1);
    });

    it("Should return all used dimensions, if there are degenerate dimensions", () => {
      const degDimMock = yamlDimensionBuilder.with({ unique_name: "degDimMock" }).addIsDegenerate().buildYamlFile();
      const dimensionMock = yamlDimensionBuilder.with({ unique_name: "dimMock2" }).buildYamlFile();
      const modelMock = modelBuilder.addDegenerateDimension(degDimMock.data.unique_name).buildYamlFile();

      const result = yamlQueries.getCatalogUsedDimensions([modelMock, dimensionMock, degDimMock]);
      expect(result).toHaveLength(1);
    });
  });

  describe("getAllDataWarehouseConnectionsUsedInRepo", () => {
    const builder = {
      dataset: YamlDatasetBuilder.create(),
      connection: YamlConnectionBuilder.create(),
      model: YamlModelBuilder.create(),
      dimension: YamlDimensionBuilder.create(),
      rowSecurity: YamlRowSecurityBuilder.create(),
    };

    const un = {
      dataset: {
        dataset1: "dataset1",
        dataset2: "dataset2",
        dataset3: "dataset3",
        dataset4: "dataset4",
      },
      connection: {
        con1: "con1",
        con2: "con2",
        con3: "con3",
        con4: "con4",
      },
      dataWarehouse: {
        dw1: "dw1",
        dw2: "dw2",
        dw3: "dw3",
        dw4: "dw4",
      },
    };

    const sml = {
      dataset: {
        dataset1: builder.dataset.uniqueName(un.dataset.dataset1).withConnection(un.connection.con1),
        dataset2: builder.dataset.uniqueName(un.dataset.dataset2).withConnection(un.connection.con2),
        dataset3: builder.dataset.uniqueName(un.dataset.dataset3).withConnection(un.connection.con3),
        dataset4: builder.dataset.uniqueName(un.dataset.dataset4).withConnection(un.connection.con4),
      },
      connection: {
        con1: builder.connection.uniqueName(un.connection.con1).engineConnection(un.dataWarehouse.dw1),
        con2: builder.connection.uniqueName(un.connection.con2).engineConnection(un.dataWarehouse.dw2),
        con3: builder.connection.uniqueName(un.connection.con3).engineConnection(un.dataWarehouse.dw3),
        con4: builder.connection.uniqueName(un.connection.con4).engineConnection(un.dataWarehouse.dw4),
      },
    };

    const allDatasets = [sml.dataset.dataset1, sml.dataset.dataset2, sml.dataset.dataset3, sml.dataset.dataset4];
    const allConnections = [sml.connection.con1, sml.connection.con2, sml.connection.con3, sml.connection.con4];
    const allConnAndDatasets = [...allDatasets, ...allConnections];

    it("Should return model's dataset connections", () => {
      const input = getRepoObjectIndex([
        sml.connection.con1.engineConnection(un.dataWarehouse.dw1),
        sml.connection.con2.engineConnection(un.dataWarehouse.dw2),
        sml.dataset.dataset1.withConnection(un.connection.con1),
        sml.dataset.dataset2.withConnection(un.connection.con1),
        sml.dataset.dataset3.withConnection(un.connection.con2),
        builder.model
          .addOrphanDataset(un.dataset.dataset1)
          .addOrphanDataset(un.dataset.dataset2)
          .addOrphanDataset(un.dataset.dataset3),
      ]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      expect(result).toEqual(new Map().set("no unique name", [un.dataWarehouse.dw1, un.dataWarehouse.dw2]));
    });

    it("Should not throw error if referenced dataset is not existing", () => {
      const input = getRepoObjectIndex([builder.model.addOrphanDataset(un.dataset.dataset4)]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      expect(result).toEqual(new Map().set("no unique name", []));
    });

    it("Should not throw error if referenced dataset's connection is not existing", () => {
      const input = getRepoObjectIndex([sml.dataset.dataset1, builder.model.addOrphanDataset(un.dataset.dataset1)]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      expect(result).toEqual(new Map().set("no unique name", []));
    });

    it("Should return the models dimensions relation dataset connection", () => {
      const input = getRepoObjectIndex([
        sml.connection.con1,
        sml.dataset.dataset1,
        builder.dimension.uniqueName("dim1").addOrphanDataset(un.dataset.dataset1),
        builder.model.addOrphanDimension("dim1"),
      ]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      expect(result).toEqual(new Map().set("no unique name", [un.dataWarehouse.dw1]));
    });

    it("Should return the inner dimension dataset too", () => {
      const input = getRepoObjectIndex([
        sml.connection.con1,
        sml.connection.con3,
        sml.dataset.dataset1,
        sml.dataset.dataset3,
        builder.dimension.uniqueName("innerDim").addOrphanDataset(un.dataset.dataset3),
        builder.dimension.uniqueName("dim1").addOrphanDataset(un.dataset.dataset1).addOrphanDimension("innerDim"),
        builder.model.addOrphanDimension("dim1"),
      ]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      expect(result).toEqual(new Map().set("no unique name", [un.dataWarehouse.dw1, un.dataWarehouse.dw3]));
    });

    it("Should skip not used connections", () => {
      const input = getRepoObjectIndex([
        ...allConnAndDatasets,
        builder.dimension.uniqueName("not used dimension 2").addOrphanDimension(un.dataset.dataset2),
        builder.dimension.uniqueName("not used dimension 3").addOrphanDimension(un.dataset.dataset3),
        builder.dimension.uniqueName("dim1_child").addOrphanDataset(un.dataset.dataset1),
        builder.dimension.uniqueName("dim1_parent").addOrphanDimension("dim1_child"),
        builder.model.uniqueName(modelOne).addOrphanDataset(un.dataset.dataset1).addOrphanDimension("dim1_parent"),
        builder.model.uniqueName("model2").addOrphanDimension("dim1_child"),
      ]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      const expectedResult = new Map().set(modelOne, [un.dataWarehouse.dw1]).set("model2", [un.dataWarehouse.dw1]);
      expect(result).toEqual(expectedResult);
    });

    it("Should get connection form the used level_attributes", () => {
      const input = getRepoObjectIndex([
        ...allConnAndDatasets,
        builder.dimension
          .uniqueName(dimension)
          .addLevelAttribute({
            unique_name: levelOne,
            dataset: un.dataset.dataset4,
          })
          .addLevelAttribute({
            unique_name: "level not used",
            dataset: un.dataset.dataset2,
          })
          .addHierarchy({
            levels: [
              {
                unique_name: levelOne,
              },
            ],
          }),
        builder.model.uniqueName(modelOne).addOrphanDimension(dimension),
      ]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      const expectedResult = new Map().set(modelOne, [un.dataWarehouse.dw4]);
      expect(result).toEqual(expectedResult);
    });

    it("Should get connection from the level_alias", () => {
      const input = getRepoObjectIndex([
        ...allConnAndDatasets,
        builder.dimension
          .uniqueName(dimension)
          .addLevelAttribute({
            unique_name: levelOne,
            dataset: un.dataset.dataset4,
          })
          .addHierarchy({
            levels: [
              {
                unique_name: levelOne,
              },
            ],
          })
          .addLevelAlias({ dataset: un.dataset.dataset3 }),
        builder.model.uniqueName(modelOne).addOrphanDimension(dimension),
      ]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      expect(result).toEqual(new Map().set(modelOne, [un.dataWarehouse.dw4, un.dataWarehouse.dw3]));
    });

    it("Should get connection from the secondary_Attribute", () => {
      const input = getRepoObjectIndex([
        ...allConnAndDatasets,
        builder.dimension
          .uniqueName(dimension)
          .addLevelAttribute({
            unique_name: levelOne,
            dataset: un.dataset.dataset4,
          })
          .addHierarchy({
            levels: [
              {
                unique_name: levelOne,
              },
            ],
          })
          .addSecondaryAttribute({ dataset: un.dataset.dataset3 }),
        builder.model.uniqueName(modelOne).addOrphanDimension(dimension),
      ]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      expect(result).toEqual(new Map().set(modelOne, [un.dataWarehouse.dw4, un.dataWarehouse.dw3]));
    });

    it("Should get connection from the metrical attribute", () => {
      const input = getRepoObjectIndex([
        ...allConnAndDatasets,
        builder.dimension
          .uniqueName(dimension)
          .addLevelAttribute({
            unique_name: levelOne,
            dataset: un.dataset.dataset4,
          })
          .addHierarchy({
            levels: [
              {
                unique_name: levelOne,
              },
            ],
          })
          .addMetric({ dataset: un.dataset.dataset3 }),
        builder.model.uniqueName(modelOne).addOrphanDimension(dimension),
      ]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      expect(result).toEqual(new Map().set(modelOne, [un.dataWarehouse.dw4, un.dataWarehouse.dw3]));
    });

    it("Should get connection from a row security", () => {
      const rsName = "row_security_name";
      const input = getRepoObjectIndex([
        ...allConnAndDatasets,
        builder.dimension
          .uniqueName(dimension)
          .addLevelAttribute({
            unique_name: levelOne,
            dataset: un.dataset.dataset4,
          })
          .addHierarchy({
            levels: [
              {
                unique_name: levelOne,
              },
            ],
          }),
        builder.rowSecurity.with({ unique_name: rsName, dataset: un.dataset.dataset3 }),
        builder.model
          .uniqueName(modelOne)
          .addOrphanDimension(dimension)
          .addRelationship({ to: { row_security: rsName } }),
      ]);

      const result = yamlQueries.getAllDataWarehouseConnectionsUsedInRepo(input);
      expect(result).toEqual(new Map().set(modelOne, [un.dataWarehouse.dw4, un.dataWarehouse.dw3]));
    });
  });

  describe("getModelDatasets", () => {
    it("Should return datasets that participate in dimension levels, relationships and metrics", () => {
      const datasetNames = ["dataset1", "dataset2", "dataset3", "dataset4"];
      const datasets = datasetNames.map((n) => YamlDatasetBuilder.create().uniqueName(n).build());
      const datasetIndex = new Map(datasets.map((d) => [d.unique_name, d]));
      const dimensions = [YamlDimensionBuilder.create().addLevelAttribute({ dataset: datasetNames[0] }).build()];
      const relationships = [
        YamlModelRelationBuilder.create().addFrom({ dataset: datasetNames[1], join_columns: [] }).build(),
      ];
      const metrics = [YamlMeasureBuilder.create().with({ dataset: datasetNames[2] }).build()];

      const result = yamlQueries.getModelDatasets(datasetIndex, dimensions, relationships, metrics);
      expect(result).toEqual(datasets.slice(0, 3));
    });
  });

  describe("YamlQueries.getModelDatasetsUniqueNamesUsedInAnyChildObject", () => {
    it("Should NOT throw an error if cycle reference is detected", () => {
      const dimBuilder = YamlDimensionBuilder.create()
        .with({
          type: IYamlDimensionType.Standard,
        })
        .addAttribute({
          unique_name: "level_attr",
          dataset: "dataset1",
          key_columns: ["id"],
          name_column: "name",
        });
      const dim1UniqueName = "dim1UniqueName";
      const dim2UniqueName = "dim2UniqueName";
      const dim3UniqueName = "dim3UniqueName";
      const datasetUniqueName = "datasetUniqueName";
      const dim1 = dimBuilder
        .uniqueName(dim1UniqueName)
        .addRelationship({
          from: {
            dataset: datasetUniqueName,
            hierarchy: "hierarchy1",
            join_columns: ["id"],
            level: "level_attr",
          },
          to: {
            dimension: dim2UniqueName,
            level: "level_attr",
          },
          type: YamlDimensionRelationType.Embedded,
        })
        .buildYamlFile();
      const dim2 = dimBuilder
        .uniqueName(dim2UniqueName)
        .addRelationship({
          from: {
            dataset: datasetUniqueName,
            hierarchy: "hierarchy1",
            join_columns: ["id"],
            level: "level_attr",
          },
          to: {
            dimension: dim3UniqueName,
            level: "level_attr",
          },
          type: YamlDimensionRelationType.Embedded,
        })
        .buildYamlFile();

      const dim3 = dimBuilder
        .uniqueName(dim3UniqueName)
        .addRelationship({
          from: {
            dataset: datasetUniqueName,
            hierarchy: "hierarchy1",
            join_columns: ["id"],
            level: "level_attr",
          },
          to: {
            dimension: dim1UniqueName,
            level: "level_attr",
          },
          type: YamlDimensionRelationType.Embedded,
        })
        .buildYamlFile();

      const model = YamlModelBuilder.create()
        .uniqueName("model")
        .addRelationship({
          from: {
            dataset: datasetUniqueName,
            join_columns: ["id"],
          },
          to: {
            dimension: dim1UniqueName,
            level: "level_attr",
          },
        })
        .buildYamlFile();

      const index = yamlQueries.sortYamlModels([dim1, dim2, dim3, model]);

      expect(() => {
        yamlQueries.getModelDatasetsUniqueNamesUsedInAnyChildObject(model.data, index);
      }).not.toThrowError();
    });
  });
});
