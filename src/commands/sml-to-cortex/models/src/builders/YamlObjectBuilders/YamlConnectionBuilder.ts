import {
SMLObjectType,
SMLConnection
} from "sml-sdk"

// import { ObjectType } from "../../ObjectType";
// import { IYamlConnection } from "../../yaml/IYamlConnection";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class YamlConnectionBuilder extends YamlObjectBuilder<SMLConnection, YamlConnectionBuilder> {
  static create(): YamlConnectionBuilder {
    const defaultData: SMLConnection = {
      unique_name: "default unique name",
      object_type: SMLObjectType.Connection,
      label: "some label",
      database: "mydb",
      schema: "mySchema",
      as_connection: "con1",
    };

    return new YamlConnectionBuilder(defaultData);
  }

  engineConnection(engineConId: string): YamlConnectionBuilder {
    return this.with({ as_connection: engineConId });
  }
}
