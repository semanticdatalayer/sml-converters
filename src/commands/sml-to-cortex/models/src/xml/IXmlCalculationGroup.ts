import { IXmlCommonVisibleProperties, IXmlSimpleKeyReference } from "./IXmlCommonProjectProperties";

export interface IXmlCalculationGroupProperties extends IXmlCommonVisibleProperties {
  description?: string;
  folder?: string;
}

export interface IXmlCalculatedMemberRef extends IXmlSimpleKeyReference {
  default?: string;
}

export interface IXmlCalculation extends IXmlCalculationGroupProperties, IXmlSimpleKeyReference {
  name: string;
  format: string;
  expression: string;
  default: string;
  templateId: string;
  attributeId: string;
  customFormat?: string;
}

export interface IXmlCalculationGroup extends IXmlSimpleKeyReference {
  name: string;
  properties: IXmlCalculationGroupProperties;
  calculatedMemberRef: Array<IXmlCalculatedMemberRef>;
}
