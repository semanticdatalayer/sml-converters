import {
  DEFAULT_LEVEL,
  DEFAULT_LEVEL_ALIAS,
  DEFAULT_METRIC,
  DEFAULT_PARALLEL_PERIOD,
  DEFAULT_SECONDARY_ATTRIBUTE,
} from "../YamlDimensionConstants";
// import { ObjectType } from "../../ObjectType";
// import { IYamlDimensionCalculationGroup, IYamlDimensionCalculationMember } from "../../yaml/IYamlCalculationGroups";
import {
  SMLObjectType,
  SMLDimensionCalculationGroup,
  SMLDimensionCalculationMember,
  SMLDimension,
  SMLDimensionHierarchy,
  SMLDimensionLevel,
  SMLDimensionLevelAttribute,
  SMLDimensionMetric,
  SMLDimensionRelationship,
  SMLDimensionSecondaryAttribute,
  SMLLevelAliasAttribute,
  SMLLevelParallelPeriod,
  SMLLevelWithMultipleDatasets,
  SMLDimensionRelationType,
} from "sml-sdk"
import YamlLevelAttributeBuilder from "./YamlLevelAttributeBuilder";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class YamlDimensionBuilder extends YamlObjectBuilder<SMLDimension, YamlDimensionBuilder> {
  static create(dimension?: SMLDimension): YamlDimensionBuilder {
    const defaultValues: SMLDimension = {
      level_attributes: [],
      hierarchies: [],
      label: "no name is set",
      object_type: SMLObjectType.Dimension,
      unique_name: "no unique name is set",
    };

    return new YamlDimensionBuilder(dimension || defaultValues);
  }

  addAttributeByUniqueName(attr: Pick<SMLDimensionLevelAttribute, "unique_name">): YamlDimensionBuilder {
    return this.addAttribute(attr);
  }

  // TODO: Duplicate with addLevelAttribute
  addAttribute(attr: Partial<SMLDimensionLevelAttribute>): YamlDimensionBuilder {
    const defaultsAttributeValues: SMLDimensionLevelAttribute = YamlLevelAttributeBuilder.create().build();

    const newAttr = Object.assign(defaultsAttributeValues, attr);
    return this.with({
      level_attributes: [...this.clonedData.level_attributes, newAttr],
    }) as YamlDimensionBuilder;
  }

  addIsDegenerate(isDegenerate = true): YamlDimensionBuilder {
    return this.with({
      is_degenerate: isDegenerate,
    }) as YamlDimensionBuilder;
  }

  addHierarchy(hierarchy: Partial<SMLDimensionHierarchy> = {}): YamlDimensionBuilder {
    const defaultHierarchyValues: SMLDimensionHierarchy = {
      unique_name: "no unique name",
      label: "name",
      levels: [{ unique_name: "level name" }],
    };

    const newHierarchy = Object.assign(defaultHierarchyValues, hierarchy);
    return this.with({
      hierarchies: [...this.clonedData.hierarchies, newHierarchy],
    });
  }

  addLevelAttribute(attribute: Partial<SMLDimensionLevelAttribute> = {}): YamlDimensionBuilder {
    const defaultLevelAttribute: SMLDimensionLevelAttribute = {
      dataset: "dataset",
      key_columns: [],
      label: "name",
      name_column: "name_column",
      unique_name: "unique_name",
    };
    const newAttribute = Object.assign(defaultLevelAttribute, attribute);
    return this.with({
      level_attributes: [...this.clonedData.level_attributes, newAttribute],
    });
  }

  addLevelAttributeWithMultipleDatasets(attribute: Partial<SMLLevelWithMultipleDatasets> = {}): YamlDimensionBuilder {
    const defaultLevelAttribute: SMLLevelWithMultipleDatasets = {
      label: "name",
      unique_name: "unique_name",
      shared_degenerate_columns: [
        {
          dataset: "dataset",
          key_columns: [],
          name_column: "name_column",
        },
      ],
    };
    const newAttribute = Object.assign(defaultLevelAttribute, attribute);
    return this.with({
      level_attributes: [...this.clonedData.level_attributes, newAttribute],
    });
  }

  addSecondaryAttribute(secondaryAttribute: Partial<SMLDimensionSecondaryAttribute> = {}): YamlDimensionBuilder {
    const newSecondaryAttribute = Object.assign({}, DEFAULT_SECONDARY_ATTRIBUTE, secondaryAttribute);
    const hierarchies = this.clonedData.hierarchies;
    hierarchies[0].levels[0].secondary_attributes = [newSecondaryAttribute];

    return this.with({
      hierarchies,
    });
  }

  addMetric(metric: Partial<SMLDimensionMetric>): YamlDimensionBuilder {
    const newMetric = Object.assign({}, DEFAULT_METRIC, metric);
    const newHierarchy: SMLDimensionHierarchy = {
      unique_name: "no unique name",
      label: "name",
      levels: [{ unique_name: "no unique name", metrics: [newMetric] }],
    };

    return this.addHierarchy().with({ hierarchies: [...(this.clonedData.hierarchies || []), newHierarchy] });
  }

  addParallelPeriod(parallelPeriod: Partial<SMLLevelParallelPeriod>): YamlDimensionBuilder {
    const newParallelPeriod = Object.assign({}, DEFAULT_PARALLEL_PERIOD, parallelPeriod);
    const newHierarchy: SMLDimensionHierarchy = {
      unique_name: "unique_name",
      label: "label",
      levels: [{ unique_name: "level_unique_name", parallel_periods: [newParallelPeriod] }],
    };

    return this.addHierarchy().with({ hierarchies: [...(this.clonedData.hierarchies || []), newHierarchy] });
  }

  addLevelAlias(levelAlias: Partial<SMLLevelAliasAttribute>): YamlDimensionBuilder {
    const newMetric = Object.assign({}, DEFAULT_LEVEL_ALIAS, levelAlias);
    const hierarchies = this.clonedData.hierarchies;
    hierarchies[0].levels[0].aliases = [newMetric];

    return this.with({
      hierarchies,
    });
  }

  static createLevel(level: Partial<SMLDimensionLevel>): SMLDimensionLevel {
    const newLevel = Object.assign({}, DEFAULT_LEVEL, level);
    return newLevel;
  }

  static createLevelWithAlias(
    level: Partial<SMLDimensionLevel>,
    alias: Array<Partial<SMLLevelAliasAttribute>>
  ): SMLDimensionLevel {
    const newLevel = YamlDimensionBuilder.createLevel(level);
    const newAliases = alias.map((a) => {
      return Object.assign({}, DEFAULT_LEVEL_ALIAS, a);
    });

    newLevel.aliases = newAliases;

    return newLevel;
  }

  static createLevelWithMetrics(
    level: Partial<SMLDimensionLevel>,
    metrics: Array<Partial<SMLDimensionMetric>>
  ): SMLDimensionLevel {
    const newLevel = YamlDimensionBuilder.createLevel(level);
    const newMetrics = metrics.map((a) => {
      return Object.assign({}, DEFAULT_METRIC, a);
    });

    newLevel.metrics = newMetrics;

    return newLevel;
  }

  static createLevelWithSecondaryAttribute(
    level: Partial<SMLDimensionLevel>,
    attributes: Array<Partial<SMLDimensionSecondaryAttribute>>
  ): SMLDimensionLevel {
    const newLevel = YamlDimensionBuilder.createLevel(level);
    const newAttributes = attributes.map((a) => {
      return Object.assign({}, DEFAULT_SECONDARY_ATTRIBUTE, a);
    });

    newLevel.secondary_attributes = newAttributes;

    return newLevel;
  }

  addRelationship(relationship: Partial<SMLDimensionRelationship> = {}): YamlDimensionBuilder {
    const defaultRelationship: SMLDimensionRelationship = {
      from: {
        dataset: "testDataset",
        join_columns: ["testJoinColumn"],
      },
      to: {
        level: "testAttr",
      },
      type: SMLDimensionRelationType.Snowflake,
    };

    const newRelationship = Object.assign(defaultRelationship, relationship);
    return this.with({
      relationships: [...(this.clonedData.relationships || []), newRelationship],
    });
  }

  addOrphanDataset(dataset_unique_name: string): YamlDimensionBuilder {
    return this.addRelationship({ from: { dataset: dataset_unique_name, join_columns: [] } });
  }

  addOrphanDimension(dimension_unique_name: string): YamlDimensionBuilder {
    return this.addRelationship({
      to: { dimension: dimension_unique_name, level: "" },
      type: SMLDimensionRelationType.Embedded,
    });
  }

  addCalculationGroup(calculationgroup: Partial<SMLDimensionCalculationGroup> = {}): YamlDimensionBuilder {
    const newCalcGroup = this.buildCalculationGroup(calculationgroup);
    return this.with({
      calculation_groups: [...(this.clonedData.calculation_groups || []), newCalcGroup],
    });
  }

  addCalcGroupAndCalculatedMembers(
    calculatedMembers: Partial<SMLDimensionCalculationMember>[] = []
  ): YamlDimensionBuilder {
    const defaultData: SMLDimensionCalculationMember = {
      expression: "no expression",
      format: "no format",
      unique_name: "no name",
    };

    const group = this.buildCalculationGroup();

    calculatedMembers.forEach((calcMember) =>
      group.calculated_members.push(Object.assign({ ...defaultData }, calcMember))
    );

    if (!group.calculated_members.length) {
      group.calculated_members.push(defaultData);
    }

    return this.addCalculationGroup(group);
  }

  private buildCalculationGroup(
    calculationgroup: Partial<SMLDimensionCalculationGroup> = {}
  ): SMLDimensionCalculationGroup {
    const defaultData: SMLDimensionCalculationGroup = {
      calculated_members: [],
      unique_name: "no name",
      label: "no label",
    };

    return Object.assign(defaultData, calculationgroup);
  }
}
