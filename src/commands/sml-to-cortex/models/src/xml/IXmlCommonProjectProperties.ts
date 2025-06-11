interface IXmlSecureTotals {
  secureTotals?: boolean;
}

interface IXmlProjectAttributeConstraint {
  enabled: boolean;
  lookup?: {
    keyRef: IXmlSimpleKeyReference;
  };
}

export interface IXmlNewRef {
  refId: string;
  attributeId: string;
  naming: string;
}

export interface IXmlFlatProtoAttributeRefPath {
  references?: Array<IXmlSimpleKeyReference>;
  newRef?: IXmlNewRef;
}

export interface IXmlFlatProtoAttributeRef {
  id: string;
  referencePath?: IXmlFlatProtoAttributeRefPath;
}

export interface IXmlCommonVisibleProperties {
  visible: boolean;
  caption?: string;
}

export interface IXmlCommonProperties {
  name: string;
  description?: string;
  notes?: string;
}

export interface IXmlSimpleKeyReference {
  id: string;
}

export interface IXmlAttributeAndKeyReferences {
  attributeRef?: IXmlFlatProtoAttributeRef;
  keyRef?: IXmlFlatProtoAttributeRef;
}

export interface IXmlDynamicConstraint {
  properties: {
    scope: {
      all?: IXmlSecureTotals;
      related?: IXmlSecureTotals;
      fact?: IXmlSecureTotals;
    };
  };
  userConstraint?: IXmlProjectAttributeConstraint;
  groupConstraint?: IXmlProjectAttributeConstraint;
}
