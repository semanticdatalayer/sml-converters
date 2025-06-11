import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IYamlModelRelationship } from "../../yaml/IYamlModel";

const generateRandomString = () => (Math.random() + 1).toString(36).substring(7);
export default class YamlModelRelationBuilder extends AnyObjectBuilder<IYamlModelRelationship> {
  static create(): YamlModelRelationBuilder {
    const defaultValues: IYamlModelRelationship = {
      from: {
        dataset: "no dataset",
        join_columns: [],
      },
      to: {
        dimension: "no dimension",
        level: "no level",
      },
      unique_name: "no uniqueName",
    };

    return new YamlModelRelationBuilder(defaultValues);
  }

  with(data: Partial<IYamlModelRelationship>): YamlModelRelationBuilder {
    return super.with(data) as YamlModelRelationBuilder;
  }

  withName(name: string): YamlModelRelationBuilder {
    return this.with({ unique_name: name });
  }

  addFrom(from: { dataset: string; join_columns: string[] }): YamlModelRelationBuilder {
    return this.with({ from, unique_name: generateRandomString() });
  }

  addTo(to: { dimension: string; level: string }): YamlModelRelationBuilder {
    return this.with({ to, unique_name: generateRandomString() });
  }
}
