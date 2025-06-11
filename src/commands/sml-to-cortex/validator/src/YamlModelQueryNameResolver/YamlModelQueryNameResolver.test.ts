import YamlCalculatedMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlCalculatedMeasureBuilder";
import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlModel, IYamlModelOverride } from "models/src/yaml/IYamlModel";

import { YamlModelQueryNameResolver } from "./YamlModelQueryNameResolver";

const resolver = new YamlModelQueryNameResolver();

const modelBuilder = YamlModelBuilder.create();
const metricBuilder = YamlMeasureBuilder.create();
const metricCalcBuilder = YamlCalculatedMeasureBuilder.create();
const dimensionBuilder = YamlDimensionBuilder.create();

type GetModelInput = {
  measures: Array<string>;
  dimensions: Array<string>;
  rolePlayDimensions: Array<{ dimension: string; rolePlay: string }>;
  overrides: Record<string, string>;
};

const buildIndex = (...files: Array<IYamlParsedFile>): Map<string, IYamlParsedFile> => {
  const result = new Map<string, IYamlParsedFile>();
  files.forEach((f) => result.set(f.data.unique_name, f));
  return result;
};

const getModel = (input: Partial<GetModelInput>): IYamlParsedFile<IYamlModel> => {
  const defaultInput: GetModelInput = {
    dimensions: [],
    measures: [],
    overrides: {},
    rolePlayDimensions: [],
  };
  const realInput = Object.assign(defaultInput, input);
  const overrides: IYamlModelOverride = {};
  Object.keys(realInput.overrides).forEach(
    (o) =>
      (overrides[o] = {
        query_name: realInput.overrides[o],
      })
  );
  let result = modelBuilder.addMetrics(...realInput.measures).withOverrides(overrides);

  realInput.dimensions.forEach((dim) => {
    result = result.addRelationship({
      from: {
        dataset: "dataset",
        join_columns: ["id"],
      },
      to: {
        dimension: dim,
        level: "no unique name",
      },
    });
  });

  realInput.rolePlayDimensions.forEach((relation) => {
    result = result.addRelationship({
      from: {
        dataset: "dataset",
        join_columns: ["id"],
      },
      to: {
        dimension: relation.dimension,
        level: "no unique name",
      },
      role_play: relation.rolePlay,
    });
  });

  return result.buildYamlFile();
};

describe("YamlModelQueryNameResolver.measures.", () => {
  it("Should resolve correct regular measure", () => {
    const measure = metricBuilder.uniqueName("regular metric").buildYamlFile();
    const model = getModel({
      measures: [measure.data.unique_name],
    });
    const allFiles = buildIndex(measure);

    const { metrics } = resolver.buildQueryableItems(model, allFiles);
    const metric = metrics[0];

    expect(metrics).toHaveLength(1);
    expect(metric.uniqueName).toBe(measure.data.unique_name);
    expect(metric.queryName).toBe(measure.data.unique_name);
    expect(metric.fullQueryName).toBe(`[Measures].[${measure.data.unique_name}]`);
    expect(metric.label).toBe(measure.data.label);
    expect(metric.description).toBeUndefined();
  });

  it("Should resolve correct regular measure with query_name override", () => {
    const measure = metricBuilder.uniqueName("regular metric").buildYamlFile();
    const overriddenName = "overriddenName";
    const model = getModel({
      measures: [measure.data.unique_name],
      overrides: { [measure.data.unique_name]: overriddenName },
    });
    const allFiles = buildIndex(measure);

    const { metrics } = resolver.buildQueryableItems(model, allFiles);
    const metric = metrics[0];

    expect(metrics).toHaveLength(1);
    expect(metric.uniqueName).toBe(measure.data.unique_name);
    expect(metric.queryName).toBe(overriddenName);
    expect(metric.fullQueryName).toBe(`[Measures].[${overriddenName}]`);
    expect(metric.label).toBe(measure.data.label);
    expect(metric.description).toBeUndefined();
  });

  it("Should resolve correct calculated measure", () => {
    const calcMeasure = metricCalcBuilder.uniqueName("calc metric").buildYamlFile();
    const model = getModel({
      measures: [calcMeasure.data.unique_name],
    });
    const allFiles = buildIndex(calcMeasure);

    const { metrics } = resolver.buildQueryableItems(model, allFiles);
    const metric = metrics[0];

    expect(metrics).toHaveLength(1);
    expect(metric.uniqueName).toBe(calcMeasure.data.unique_name);
    expect(metric.queryName).toBe(calcMeasure.data.unique_name);
    expect(metric.fullQueryName).toBe(`[Measures].[${calcMeasure.data.unique_name}]`);
    expect(metric.label).toBe(calcMeasure.data.label);
    expect(metric.description).toBeUndefined();
  });

  it("Should resolve correct regular measure with query_name override", () => {
    const calcMeasure = metricCalcBuilder.uniqueName("regular metric").buildYamlFile();
    const overriddenName = "overriddenName";
    const model = getModel({
      measures: [calcMeasure.data.unique_name],
      overrides: { [calcMeasure.data.unique_name]: overriddenName },
    });
    const allFiles = buildIndex(calcMeasure);

    const { metrics } = resolver.buildQueryableItems(model, allFiles);
    const metric = metrics[0];

    expect(metrics).toHaveLength(1);
    expect(metric.uniqueName).toBe(calcMeasure.data.unique_name);
    expect(metric.queryName).toBe(overriddenName);
    expect(metric.fullQueryName).toBe(`[Measures].[${overriddenName}]`);
    expect(metric.label).toBe(calcMeasure.data.label);
    expect(metric.description).toBeUndefined();
  });

  it("Should resolve correct dimension metrical attribute", () => {
    const metricalAttributeUniqueName = "metrical attribute";
    const metricalAttributeLabel = "metrical attribute label";
    const dimensionFile = dimensionBuilder
      .uniqueName("dimension")
      .addMetric({
        unique_name: metricalAttributeUniqueName,
        label: metricalAttributeLabel,
      })
      .buildYamlFile();

    const model = getModel({
      dimensions: [dimensionFile.data.unique_name],
    });
    const allFiles = buildIndex(dimensionFile);

    const { metrics } = resolver.buildQueryableItems(model, allFiles);
    const metric = metrics[0];

    expect(metrics).toHaveLength(1);
    expect(metric.uniqueName).toBe(metricalAttributeUniqueName);
    expect(metric.queryName).toBe(metricalAttributeUniqueName);
    expect(metric.fullQueryName).toBe(`[Measures].[${metricalAttributeUniqueName}]`);
    expect(metric.label).toBe(metricalAttributeLabel);
    expect(metric.description).toBeUndefined();
  });

  it("Should skip missing measures", () => {
    const measure = metricBuilder.uniqueName("regular metric").buildYamlFile();
    const model = getModel({
      measures: [measure.data.unique_name, "missing_metric"],
    });
    const allFiles = buildIndex(measure);

    const { metrics } = resolver.buildQueryableItems(model, allFiles);
    const metric = metrics[0];

    expect(metrics).toHaveLength(1);
    expect(metric.uniqueName).toBe(measure.data.unique_name);
    expect(metric.queryName).toBe(measure.data.unique_name);
    expect(metric.fullQueryName).toBe(`[Measures].[${measure.data.unique_name}]`);
    expect(metric.label).toBe(measure.data.label);
    expect(metric.description).toBeUndefined();
  });
});

describe("YamlModelQueryNameResolver.dimensions.", () => {
  it("Should resolve correct dimension with hierarchies and calculation groups", () => {
    const dimensionFile = dimensionBuilder
      .uniqueName("dimension")
      .addHierarchy({
        unique_name: "dim1_hierarchy1",
        levels: [
          {
            unique_name: "no unique name",
            secondary_attributes: [
              {
                unique_name: "dim1_hierarchy1_level1_secondaryAtttribute",
                dataset: "dataset",
                label: "test",
                name_column: "name_column",
              },
            ],
          },
          { unique_name: "dim1_hierarchy1_level2" },
          { unique_name: "dim1_hierarchy1_level3" },
        ],
      })
      .addLevelAttribute({
        unique_name: "no unique name",
      })
      .addCalculationGroup({
        unique_name: "calculation_group_00",
        label: "calculation_group_00",
        folder: "calculation_group_00_folder",
        calculated_members: [
          {
            unique_name: "calculation_member_000",
          },
        ],
      })
      .buildYamlFile();

    const model = getModel({
      dimensions: [dimensionFile.data.unique_name],
    });
    const allFiles = buildIndex(dimensionFile);

    const result = resolver.buildQueryableItems(model, allFiles);

    expect(result.dimensions).toHaveLength(1);
    expect(result.dimensions[0]).toEqual(
      expect.objectContaining({
        uniqueName: dimensionFile.data.unique_name,
        queryName: dimensionFile.data.unique_name,
        fullQueryName: `[${dimensionFile.data.unique_name}]`,
        label: dimensionFile.data.label,
        description: dimensionFile.data.description,
      })
    );

    const calculationGroupData = dimensionFile.data.calculation_groups![0];
    expect(result.dimensions[0].calculationGroups[0]).toEqual(
      expect.objectContaining({
        uniqueName: calculationGroupData.unique_name,
        queryName: calculationGroupData.unique_name,
        fullQueryName: `[${dimensionFile.data.unique_name}].[${calculationGroupData.unique_name}]`,
        label: calculationGroupData.label,
        folder: calculationGroupData.folder,
      })
    );

    const calculationMemberData = dimensionFile.data.calculation_groups![0].calculated_members![0];
    expect(result.dimensions[0].calculationGroups[0].calculationMembers[0]).toEqual(
      expect.objectContaining({
        uniqueName: calculationMemberData.unique_name,
        queryName: calculationMemberData.unique_name,
        fullQueryName: `[${dimensionFile.data.unique_name}].[${calculationGroupData.unique_name}].[${calculationMemberData.unique_name}]`,
        label: calculationMemberData.unique_name,
      })
    );

    const hierarchyData = dimensionFile.data.hierarchies[0];
    expect(result.dimensions[0].hierarchies[0]).toEqual(
      expect.objectContaining({
        uniqueName: hierarchyData.unique_name,
        queryName: hierarchyData.unique_name,
        fullQueryName: `[${dimensionFile.data.unique_name}].[${hierarchyData.unique_name}]`,
        label: hierarchyData.label,
        description: hierarchyData.description,
      })
    );

    const levelData = dimensionFile.data.hierarchies[0].levels[0];
    const levelAttributeData = dimensionFile.data.level_attributes[0];

    expect(result.dimensions[0].hierarchies[0].levels[0]).toEqual(
      expect.objectContaining({
        uniqueName: levelData.unique_name,
        queryName: levelData.unique_name,
        fullQueryName: `[${dimensionFile.data.unique_name}].[${hierarchyData.unique_name}].[${levelData.unique_name}]`,
        label: levelAttributeData.label,
        description: levelAttributeData.description,
      })
    );

    const secondaryAttributeData = dimensionFile.data.hierarchies[0].levels[0].secondary_attributes?.[0];
    expect(result.dimensions[0].hierarchies[0].levels[0].secondaryAttributes?.[0]).toEqual(
      expect.objectContaining({
        uniqueName: secondaryAttributeData?.unique_name,
        queryName: secondaryAttributeData?.unique_name,
        fullQueryName: `[${dimensionFile.data.unique_name}].[${secondaryAttributeData?.unique_name}].[${secondaryAttributeData?.unique_name}]`,
        label: secondaryAttributeData?.label,
        description: secondaryAttributeData?.description,
      })
    );
  });

  it("Should resolve correct dimension with hierarchies when there is an role play relationship", () => {
    const dimensionFile = dimensionBuilder
      .uniqueName("dimension")
      .addHierarchy({
        unique_name: "dim1_hierarchy1",
        levels: [
          {
            unique_name: "no unique name",
            secondary_attributes: [
              {
                unique_name: "dim1_hierarchy1_level1_secondaryAtttribute",
                dataset: "dataset",
                label: "test",
                name_column: "name_column",
              },
            ],
          },
          { unique_name: "dim1_hierarchy1_level2" },
          { unique_name: "dim1_hierarchy1_level3" },
        ],
      })
      .addLevelAttribute({
        unique_name: "no unique name",
      })
      .buildYamlFile();

    const rolePlay = "Role play";

    const model = getModel({
      dimensions: [dimensionFile.data.unique_name],
      rolePlayDimensions: [
        {
          dimension: dimensionFile.data.unique_name,
          rolePlay: `${rolePlay} {0}`,
        },
      ],
    });
    const allFiles = buildIndex(dimensionFile);

    const result = resolver.buildQueryableItems(model, allFiles);

    expect(result.dimensions).toHaveLength(2);
    expect(result.dimensions[1]).toEqual(
      expect.objectContaining({
        uniqueName: dimensionFile.data.unique_name,
        queryName: `${rolePlay} ${dimensionFile.data.unique_name}`,
        fullQueryName: `[${rolePlay} ${dimensionFile.data.unique_name}]`,
        label: `${rolePlay} ${dimensionFile.data.label}`,
        description: dimensionFile.data.description,
      })
    );

    const hierarchyData = dimensionFile.data.hierarchies[0];
    expect(result.dimensions[1].hierarchies[0]).toEqual(
      expect.objectContaining({
        uniqueName: hierarchyData.unique_name,
        queryName: `${rolePlay} ${hierarchyData.unique_name}`,
        fullQueryName: `[${rolePlay} ${dimensionFile.data.unique_name}].[${rolePlay} ${hierarchyData.unique_name}]`,
        label: `${rolePlay} ${hierarchyData.label}`,
        description: hierarchyData.description,
      })
    );

    const levelData = dimensionFile.data.hierarchies[0].levels[0];
    const levelAttributeData = dimensionFile.data.level_attributes[0];

    expect(result.dimensions[1].hierarchies[0].levels[0]).toEqual(
      expect.objectContaining({
        uniqueName: levelData.unique_name,
        queryName: `${rolePlay} ${levelData.unique_name}`,
        fullQueryName: `[${rolePlay} ${dimensionFile.data.unique_name}].[${rolePlay} ${hierarchyData.unique_name}].[${rolePlay} ${levelData.unique_name}]`,
        label: `${rolePlay} ${levelAttributeData.label}`,
        description: levelAttributeData.description,
      })
    );

    const secondaryAttributeData = dimensionFile.data.hierarchies[0].levels[0].secondary_attributes?.[0];
    expect(result.dimensions[1].hierarchies[0].levels[0].secondaryAttributes?.[0]).toEqual(
      expect.objectContaining({
        uniqueName: secondaryAttributeData?.unique_name,
        queryName: `${rolePlay} ${secondaryAttributeData?.unique_name}`,
        fullQueryName: `[${rolePlay} ${dimensionFile.data.unique_name}].[${rolePlay} ${secondaryAttributeData?.unique_name}].[${rolePlay} ${secondaryAttributeData?.unique_name}]`,
        label: `${rolePlay} ${secondaryAttributeData?.label}`,
        description: secondaryAttributeData?.description,
      })
    );
  });

  it("Should resolve without including hierarchies with levels that doesn't have relationship", () => {
    const dimensionFile = dimensionBuilder
      .uniqueName("dimension")
      .addHierarchy({
        unique_name: "dim1_hierarchy1",
        levels: [
          {
            unique_name: "level that is not used in a relationship",
            secondary_attributes: [
              {
                unique_name: "dim1_hierarchy1_level1_secondaryAtttribute",
                dataset: "dataset",
                label: "test",
                name_column: "name_column",
              },
            ],
          },
          { unique_name: "dim1_hierarchy1_level2" },
          { unique_name: "dim1_hierarchy1_level3" },
        ],
      })
      .addLevelAttribute({
        unique_name: "level that is not used in a relationship",
      })
      .buildYamlFile();

    const model = getModel({
      dimensions: [dimensionFile.data.unique_name],
    });
    const allFiles = buildIndex(dimensionFile);

    const result = resolver.buildQueryableItems(model, allFiles);

    expect(result.dimensions).toHaveLength(1);
    expect(result.dimensions[0]).toEqual(
      expect.objectContaining({
        uniqueName: dimensionFile.data.unique_name,
        queryName: dimensionFile.data.unique_name,
        fullQueryName: `[${dimensionFile.data.unique_name}]`,
        label: dimensionFile.data.label,
        description: dimensionFile.data.description,
      })
    );

    expect(result.dimensions[0].hierarchies).toHaveLength(0);
  });

  it("Should skip missing dimensions", () => {
    const dimensionFile = dimensionBuilder.uniqueName("dimension").buildYamlFile();

    const model = getModel({
      dimensions: [dimensionFile.data.unique_name, "missing_dimension"],
    });
    const allFiles = buildIndex(dimensionFile);

    const result = resolver.buildQueryableItems(model, allFiles);

    expect(result.dimensions).toHaveLength(1);
    expect(result.dimensions[0]).toEqual(
      expect.objectContaining({
        uniqueName: dimensionFile.data.unique_name,
        queryName: dimensionFile.data.unique_name,
        fullQueryName: `[${dimensionFile.data.unique_name}]`,
        label: dimensionFile.data.label,
        description: dimensionFile.data.description,
      })
    );
  });

  it("Should not throw exception if dimensions have cycle dependency", () => {
    const dimCustomerName = "dimCustomer";
    const dimGenderName = "dimGender";
    const dimCustomer = dimensionBuilder
      .uniqueName(dimCustomerName)
      .addRelationship({
        unique_name: "Customer_to_gender",
        from: {
          hierarchy: "Customer Hierarchy",
          dataset: "dimcusotmer",
          level: "Customer Name",
          join_columns: ["gender"],
        },
        to: {
          dimension: dimGenderName,
          level: "Gender",
        },
      })
      .buildYamlFile();

    const dimGender = dimensionBuilder
      .uniqueName(dimGenderName)
      .addRelationship({
        unique_name: "gender_to_customer",
        from: {
          hierarchy: "Gender Hierarchy",
          dataset: "dimGender",
          level: "Gender",
          join_columns: ["genderkey"],
        },
        to: {
          dimension: dimCustomerName,
          level: "Customer Name",
        },
      })
      .buildYamlFile();

    const model = getModel({
      dimensions: [dimCustomer.data.unique_name, dimGender.data.unique_name],
    });
    const allFiles = buildIndex(dimCustomer, dimGender);

    const result = resolver.buildQueryableItems(model, allFiles);

    expect(result.dimensions).toHaveLength(2);
  });
});
