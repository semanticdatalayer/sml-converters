import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IYamlDimensionRelationship, YamlDimensionRelationType } from "../../yaml/IYamlDimension";

export class YamlDimensionRelationBuilder extends AnyObjectBuilder<IYamlDimensionRelationship> {
  static create(): YamlDimensionRelationBuilder {
    const defaultValues: IYamlDimensionRelationship = {
      from: {
        dataset: "",
        join_columns: [],
      },
      to: {
        level: "",
      },
      type: YamlDimensionRelationType.Snowflake,
    };
    return new YamlDimensionRelationBuilder(defaultValues);
  }

  with(data: Partial<IYamlDimensionRelationship>): YamlDimensionRelationBuilder {
    return super.with(data) as YamlDimensionRelationBuilder;
  }

  withDataset(dataset: string): YamlDimensionRelationBuilder {
    return this.with({
      from: {
        dataset: dataset,
        join_columns: [],
      },
    });
  }

  withLevel(level: string): YamlDimensionRelationBuilder {
    return this.with({
      to: {
        level: level,
      },
    });
  }

  withRowSecurity(rowSecurity: string): YamlDimensionRelationBuilder {
    return this.with({
      to: {
        row_security: rowSecurity,
      },
    });
  }

  withType(type: YamlDimensionRelationType): YamlDimensionRelationBuilder {
    return this.with({
      type: type,
    });
  }
}
