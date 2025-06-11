import { ObjectType } from "../../ObjectType";
import { IYamlObject } from "../../yaml/IYamlObject";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class AnyYamlObjectBuilder extends YamlObjectBuilder<IYamlObject, AnyYamlObjectBuilder> {
  static create(defaultData: Partial<IYamlObject>): AnyYamlObjectBuilder {
    const defaults: IYamlObject = {
      label: "no label",
      object_type: ObjectType.Catalog,
      unique_name: "no unique_name",
    };
    return new AnyYamlObjectBuilder(Object.assign(defaults, defaultData));
  }
}
