import { IXmlProjectAttributeKey } from "../IXmlProjectAttributeKey";
import { IXmlProjectCalculatedMember } from "../IXmlProjectCalculatedMember";

export const XmlCalculatedMemberGuard = {
  isCalculatedMember(input: IXmlProjectAttributeKey | IXmlProjectCalculatedMember) {
    return Object.getOwnPropertyNames(input).includes("expression");
  },
};
