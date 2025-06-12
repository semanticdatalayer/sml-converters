import { AnyObjectBuilder } from "../../../../../utils/builders/AnyObjectBuilder";

import { IXmlProjectAttribute } from "../../../xml/IXmlProjectAttribute";

export default class XmlAttributeBuilder extends AnyObjectBuilder<IXmlProjectAttribute> {
  static create(): XmlAttributeBuilder {
    const defaultData: IXmlProjectAttribute = {
      id: "id",
      name: "name",
      properties: {
        type: { enum: "" },
        visible: true,
      },
      yamlColumnName: "yamlColumnName",
      yamlDataset: "dataset",
    };

    return new XmlAttributeBuilder(defaultData);
  }
}
