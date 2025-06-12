import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { IXmlDatasetLogical, IXmlDatasetLogicalKeyRef, IXmlIncrementalIndicator } from "../../xml/IXmlDatasetLogical";

export default class XmlDatasetLogicalBuilder extends AnyObjectBuilder<IXmlDatasetLogical> {
  static create(): XmlDatasetLogicalBuilder {
    const defaultLogical: IXmlDatasetLogical = {
      attributeRef: [],
      keyRef: [],
    };

    return new XmlDatasetLogicalBuilder(defaultLogical);
  }

  addKeyRef(keyRef?: Partial<IXmlDatasetLogicalKeyRef>): XmlDatasetLogicalBuilder {
    const defaultDataset: IXmlDatasetLogicalKeyRef = {
      yamlUniqueName: "yamlUniqueName",
      id: "uuid",
      column: ["role-play-column"],
      unique: "true",
      complete: "true",
    };

    const newKeyRef = Object.assign({}, defaultDataset, keyRef);

    return this.with({ keyRef: [...(this.clonedData.keyRef || []), newKeyRef] });
  }

  addIncrementalAggregate(keyRef?: Partial<IXmlIncrementalIndicator>): XmlDatasetLogicalBuilder {
    const defaultDataset: IXmlIncrementalIndicator = { keyRef: { id: "incrementalId" } };

    const newIncrementalAgg = Object.assign(defaultDataset, keyRef);

    return this.with({ incrementalIndicator: newIncrementalAgg });
  }

  with(data: Partial<IXmlDatasetLogical>): XmlDatasetLogicalBuilder {
    return super.with(data) as XmlDatasetLogicalBuilder;
  }
}
