/**
 * The attribute property in xml <attributes> presented:
 * Level Alias Secondary Attribute;
 * Security Dimension;
 */

import { IXmlProjectKeyedAttributeProperties } from "./IXmlProjectKeyedAttribute";

export interface IXmlProjectAttribute {
  id: string;
  name: string;
  properties: IXmlProjectKeyedAttributeProperties;
  yamlDataset: string;
  yamlColumnName: string;
}
