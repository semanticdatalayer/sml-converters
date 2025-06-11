import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IXmlProjectAttributeKey } from "../../../xml/IXmlProjectAttributeKey";

export default class XmlAttributeKeyBuilder extends AnyObjectBuilder<IXmlProjectAttributeKey> {
  static create(): XmlAttributeKeyBuilder {
    const defaultData: IXmlProjectAttributeKey = {
      id: "id",
      properties: {
        visible: true,
      },
      yamlUniqueName: "yamlUniqueName",
    };

    return new XmlAttributeKeyBuilder(defaultData);
  }
}
