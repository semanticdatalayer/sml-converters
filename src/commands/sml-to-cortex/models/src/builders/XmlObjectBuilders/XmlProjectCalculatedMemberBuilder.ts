import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import {
  IXmlProjectCalculatedMember,
  IXmlProjectCalculatedMemberProperties,
} from "../../xml/IXmlProjectCalculatedMember";

export default class XmlProjectCalculatedMemberBuilder extends AnyObjectBuilder<IXmlProjectCalculatedMember> {
  static create() {
    const defaultData: IXmlProjectCalculatedMember = {
      id: "testId",
      name: "test name",
      properties: {} as IXmlProjectCalculatedMemberProperties,
      expression: "testExpression",
    };

    return new XmlProjectCalculatedMemberBuilder(defaultData);
  }
}
