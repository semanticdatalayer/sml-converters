import { 
  SMLObject,
  SMLObjectType 
 } from "sml-sdk"; 

// import { ObjectType } from "../../ObjectType";
// import { IYamlObject } from "../../yaml/IYamlObject";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class AnyYamlObjectBuilder extends YamlObjectBuilder<SMLObject, AnyYamlObjectBuilder> {
  static create(defaultData: Partial<SMLObject>): AnyYamlObjectBuilder {
    const defaults: SMLObject = {
      label: "no label",
      object_type: SMLObjectType.Catalog,
      unique_name: "no unique_name",
    };
    return new AnyYamlObjectBuilder(Object.assign(defaults, defaultData));
  }
}
