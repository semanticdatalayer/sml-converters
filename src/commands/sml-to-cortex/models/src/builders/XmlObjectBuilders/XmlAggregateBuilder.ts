import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { IXmlAggregate, IXmlAttributes } from "../../xml/IXmlAggregate";
import { IXmlAttributeAndKeyReferences } from "../../xml/IXmlCommonProjectProperties";

export default class XmlAggregateBuilder extends AnyObjectBuilder<IXmlAggregate> {
  static create(): XmlAggregateBuilder {
    const defaultData: IXmlAggregate = {
      id: "",
      name: "",
      properties: {
        name: "",
      },
      attributes: {},
    };

    return new XmlAggregateBuilder(defaultData);
  }

  with(data: Partial<IXmlAggregate>): XmlAggregateBuilder {
    return super.with(data) as XmlAggregateBuilder;
  }

  addAttribute(attribute: IXmlAttributes): XmlAggregateBuilder {
    const defaultData: IXmlAttributes = {
      attributeRef: [],
    };

    const newAttr = Object.assign(defaultData, attribute);

    return this.with({
      attributes: newAttr,
    });
  }

  addDistribution(data: IXmlAttributeAndKeyReferences): XmlAggregateBuilder {
    const defaultData: IXmlAttributeAndKeyReferences = this.generateDefaultAttributeAndKeyRef();

    const newAttr = Object.assign(defaultData, data);

    return this.with({
      distributionReferences: [...(this.clonedData.distributionReferences || []), newAttr],
    });
  }

  addPartition(data: IXmlAttributeAndKeyReferences): XmlAggregateBuilder {
    const defaultData: IXmlAttributeAndKeyReferences = this.generateDefaultAttributeAndKeyRef();

    const newAttr = Object.assign(defaultData, data);

    return this.with({
      partitionReferences: [...(this.clonedData.partitionReferences || []), newAttr],
    });
  }

  private generateDefaultAttributeAndKeyRef(): IXmlAttributeAndKeyReferences {
    return {
      attributeRef: {
        id: "",
      },
    };
  }
}
