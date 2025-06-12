import { SMLAggregationMethod } from 'sml-sdk';
import { IXmlCommonVisibleProperties, IXmlSimpleKeyReference } from "./IXmlCommonProjectProperties";
import { IXmlAttributeCalculatedMemberFormatting } from "./IXmlProjectKeyedAttribute";

export interface IXmlProjectCalculatedMemberProperties extends IXmlCommonVisibleProperties {
  formatting?: IXmlAttributeCalculatedMemberFormatting;
  type?: {
    calculatedDimensionMember: string;
  };
  folder?: string;
  description?: string;
  expression?: string;
}

export interface IXmlProjectCalculatedMember extends IXmlSimpleKeyReference {
  name: string;
  properties: IXmlProjectCalculatedMemberProperties;
  expression: string;
  mdxAggregateFunction?: SMLAggregationMethod;
}
