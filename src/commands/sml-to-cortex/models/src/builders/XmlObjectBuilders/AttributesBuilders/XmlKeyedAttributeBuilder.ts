import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IXmlProjectKeyedAttribute } from "../../../xml/IXmlProjectKeyedAttribute";

export default class XmlKeyedAttributeBuilder extends AnyObjectBuilder<IXmlProjectKeyedAttribute> {
  static create(): XmlKeyedAttributeBuilder {
    const defaultData: IXmlProjectKeyedAttribute = {
      id: "id",
      properties: {
        type: { enum: "" },
        visible: true,
      },
      yamlNameColumn: "yamlNameColumn",
      keyRef: "keyRef",
      name: "name",
    };

    return new XmlKeyedAttributeBuilder(defaultData);
  }
}
