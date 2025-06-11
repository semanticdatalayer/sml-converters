import { IXmlAttributeFormatting, IXmlBaseAttributeProperties } from "./IXmlProjectKeyedAttribute";

export interface IXmlProjectAttributeKeyProperties extends IXmlBaseAttributeProperties {
  columns?: number;
  highCardinality?: string;
  formatting?: IXmlAttributeFormatting;
  folder?: string;
  description?: string;
}

export interface IXmlProjectAttributeKey {
  id: string;
  name?: string;
  properties: IXmlProjectAttributeKeyProperties;
  yamlUniqueName: string;
  yamlKeyColumns?: Array<string>;
}
