import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import {
  SMLDimensionRelationship,
  SMLDimensionRelationType
} from "sml-sdk"

// import { IYamlDimensionRelationship, YamlDimensionRelationType } from "../../yaml/IYamlDimension";

export class YamlDimensionRelationBuilder extends AnyObjectBuilder<SMLDimensionRelationship> {
  static create(): YamlDimensionRelationBuilder {
    const defaultValues: SMLDimensionRelationship = {
      from: {
        dataset: "",
        join_columns: [],
      },
      to: {
        level: "",
      },
      type: SMLDimensionRelationType.Snowflake,
    };
    return new YamlDimensionRelationBuilder(defaultValues);
  }

  with(data: Partial<SMLDimensionRelationship>): YamlDimensionRelationBuilder {
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

  withType(type: SMLDimensionRelationType): YamlDimensionRelationBuilder {
    return this.with({
      type: type,
    });
  }
}
