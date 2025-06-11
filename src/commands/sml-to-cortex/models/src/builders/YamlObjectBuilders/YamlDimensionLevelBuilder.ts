import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import {
  DEFAULT_LEVEL_ALIAS,
  DEFAULT_METRIC,
  DEFAULT_SECONDARY_ATTRIBUTE,
} from "../../../builders/constants/YamlDimensionConstants";
import {
  IYamlDimensionLevel,
  IYamlDimensionMetric,
  IYamlDimensionSecondaryAttribute,
  IYamlLevelAliasAttribute,
} from "../../yaml/IYamlDimension";

export default class YamlDimensionLevelBuilder extends AnyObjectBuilder<IYamlDimensionLevel> {
  static create(): YamlDimensionLevelBuilder {
    const defaultValues: IYamlDimensionLevel = {
      unique_name: "level_1",
    };

    return new YamlDimensionLevelBuilder(defaultValues);
  }

  with(data: Partial<IYamlDimensionLevel>): YamlDimensionLevelBuilder {
    return super.with(data) as YamlDimensionLevelBuilder;
  }

  addSecondaryAttribute(secondaryAttribute: Partial<IYamlDimensionSecondaryAttribute> = {}): YamlDimensionLevelBuilder {
    const newSecondaryAttribute = Object.assign({}, DEFAULT_SECONDARY_ATTRIBUTE, secondaryAttribute);
    const secondaryAttributes = this.clonedData.secondary_attributes || [];

    return this.with({
      secondary_attributes: [...secondaryAttributes, newSecondaryAttribute],
    });
  }

  addLevelAlias(alias: Partial<IYamlLevelAliasAttribute> = {}): YamlDimensionLevelBuilder {
    const newAlias = Object.assign({}, DEFAULT_LEVEL_ALIAS, alias);
    const aliasesList = this.clonedData.aliases || [];

    return this.with({
      aliases: [...aliasesList, newAlias],
    });
  }

  addMetric(metric: Partial<IYamlDimensionMetric> = {}): YamlDimensionLevelBuilder {
    const newMetric = Object.assign({}, DEFAULT_METRIC, metric);
    const metricsList = this.clonedData.metrics || [];

    return this.with({
      metrics: [...metricsList, newMetric],
    });
  }
}
