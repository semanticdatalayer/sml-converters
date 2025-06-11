import { IXmlCommonProperties, IXmlSimpleKeyReference } from "./IXmlCommonProjectProperties";

/** This interface is created based on the xml
 * In action.go Participants property is array of object
 */
export interface IXmlAttributeRef extends IXmlSimpleKeyReference {
  refPath?: Array<string>;
}

export interface IXmlDrillThrough extends IXmlSimpleKeyReference {
  id: string;
  name: string;
  participants: {
    attributeRef: Array<IXmlAttributeRef>;
  };
  properties?: IXmlCommonProperties;
}

export interface IXmlCubeAction {
  properties: {
    includeDefaultDrillThrough: string;
  };
  drillThrough?: Array<IXmlDrillThrough>;
}
