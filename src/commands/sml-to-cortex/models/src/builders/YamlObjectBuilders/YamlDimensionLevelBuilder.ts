import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import {
  DEFAULT_LEVEL_ALIAS,
  DEFAULT_METRIC,
  DEFAULT_SECONDARY_ATTRIBUTE,
} from "../YamlDimensionConstants";
import {
  SMLDimensionLevel,
  SMLDimensionMetric,
  SMLDimensionSecondaryAttribute,
  SMLLevelAliasAttribute,
} from "sml-sdk";

export default class YamlDimensionLevelBuilder extends AnyObjectBuilder<SMLDimensionLevel> {
  static create(): YamlDimensionLevelBuilder {
    const defaultValues: SMLDimensionLevel = {
      unique_name: "level_1",
    };

    return new YamlDimensionLevelBuilder(defaultValues);
  }

  with(data: Partial<SMLDimensionLevel>): YamlDimensionLevelBuilder {
    return super.with(data) as YamlDimensionLevelBuilder;
  }

  addSecondaryAttribute(secondaryAttribute: Partial<SMLDimensionSecondaryAttribute> = {}): YamlDimensionLevelBuilder {
    const newSecondaryAttribute = Object.assign({}, DEFAULT_SECONDARY_ATTRIBUTE, secondaryAttribute);
    const secondaryAttributes = this.clonedData.secondary_attributes || [];

    return this.with({
      secondary_attributes: [...secondaryAttributes, newSecondaryAttribute],
    });
  }

  addLevelAlias(alias: Partial<SMLLevelAliasAttribute> = {}): YamlDimensionLevelBuilder {
    const newAlias = Object.assign({}, DEFAULT_LEVEL_ALIAS, alias);
    const aliasesList = this.clonedData.aliases || [];

    return this.with({
      aliases: [...aliasesList, newAlias],
    });
  }

  addMetric(metric: Partial<SMLDimensionMetric> = {}): YamlDimensionLevelBuilder {
    const newMetric = Object.assign({}, DEFAULT_METRIC, metric);
    const metricsList = this.clonedData.metrics || [];

    return this.with({
      metrics: [...metricsList, newMetric],
    });
  }
}
