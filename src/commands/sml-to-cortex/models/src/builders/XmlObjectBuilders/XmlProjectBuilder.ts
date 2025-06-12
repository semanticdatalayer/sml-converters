import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { IXmlDataset } from "../../xml/IXmlDataset";
import { IXmlDimension } from "../../xml/IXmlDimension";
import IXmlProject from "../../xml/IXmlProject";
import { IXmlProjectAttributeKey } from "../../xml/IXmlProjectAttributeKey";
import { IXmlProjectCalculatedMember } from "../../xml/IXmlProjectCalculatedMember";
import { IXmlProjectKeyedAttribute } from "../../xml/IXmlProjectKeyedAttribute";
import XmlAttributeKeyBuilder from "./AttributesBuilders/XmlAttributeKeyBuilder";
import XmlKeyedAttributeBuilder from "./AttributesBuilders/XmlKeyedAttributeBuilder";
import XmlProjectCalculatedMemberBuilder from "./XmlProjectCalculatedMemberBuilder";

export default class XmlProjectBuilder extends AnyObjectBuilder<IXmlProject> {
  static create() {
    const defaultData: IXmlProject = {
      name: "no name",
      projectMetadata: {
        version: "no version",
        schema: "no schema",
        schemaLocation: "no location",
        schemaInstance: "no instance",
      },
      annotations: [],
      properties: {
        visible: false,
      },
      datasets: [],
      cubes: [],
    };

    return new XmlProjectBuilder(defaultData);
  }

  with(data: Partial<IXmlProject>): XmlProjectBuilder {
    return super.with(data) as XmlProjectBuilder;
  }

  addDataset(dataset: Partial<IXmlDataset> = {}): XmlProjectBuilder {
    const defaultData: IXmlDataset = {
      id: "no dataset id",
      name: "no dataset name",
      properties: {
        allowAggregates: false,
      },
      physical: {
        connection: {
          id: "no physical connection id",
        },
        column: [],
        immutable: "no physical immutable name",
      },
    };

    const newDataset = Object.assign(defaultData, dataset);

    return this.with({ datasets: [...(this.clonedData.datasets || []), newDataset] });
  }

  addDimension(dimension: Partial<IXmlDimension> = {}): XmlProjectBuilder {
    const defaultData: IXmlDimension = {
      id: "no dimension id",
      name: "no dimension name",
      properties: {
        visible: false,
      },
      hierarchies: [],
    };

    const newDimension = Object.assign(defaultData, dimension);

    return this.with({ dimensions: [...(this.clonedData.dimensions || []), newDimension] });
  }

  addKeyedAttribute(keyedAttribute: Partial<IXmlProjectKeyedAttribute> = {}): XmlProjectBuilder {
    const defaultData: IXmlProjectKeyedAttribute = XmlKeyedAttributeBuilder.create().build();

    const newKeyedAttribute = Object.assign(defaultData, keyedAttribute);

    return this.with({
      attributes: { keyedAttribute: [...(this.clonedData.attributes?.keyedAttribute || []), newKeyedAttribute] },
    });
  }

  addAttributeKey(keyedAttribute: Partial<IXmlProjectAttributeKey> = {}): XmlProjectBuilder {
    const defaultData: IXmlProjectAttributeKey = XmlAttributeKeyBuilder.create().build();

    const newKeyedAttribute = Object.assign(defaultData, keyedAttribute);

    return this.with({
      attributes: { attributeKey: [...(this.clonedData.attributes?.attributeKey || []), newKeyedAttribute] },
    });
  }

  addCalculatedMember(calculatedMember: Partial<IXmlProjectCalculatedMember> = {}): XmlProjectBuilder {
    const defaultData: IXmlProjectCalculatedMember = XmlProjectCalculatedMemberBuilder.create().build();

    const newCalcMember = Object.assign(defaultData, calculatedMember);

    return this.with({
      calculatedMembers: [...(this.clonedData.calculatedMembers || []), newCalcMember],
    });
  }
}
