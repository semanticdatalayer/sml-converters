import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { IXmlPerspective } from "../../xml/IXmlPerspective";

export default class XmlPerspectiveBuilder extends AnyObjectBuilder<IXmlPerspective> {
  static create(): XmlPerspectiveBuilder {
    const basicCube: IXmlPerspective = {
      name: "name",
      id: "uuid",
      cubeRef: "uuid",
    };

    return new XmlPerspectiveBuilder(basicCube);
  }
}
