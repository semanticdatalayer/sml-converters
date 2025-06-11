import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IXmlDataset } from "../../xml/IXmlDataset";
import { IXmlDatasetLogical } from "../../xml/IXmlDatasetLogical";

export default class XmlDatasetBuilder extends AnyObjectBuilder<IXmlDataset> {
  static create() {
    const defaultData: IXmlDataset = {
      id: "dataset Id",
      name: "dataset name",
      properties: {
        allowAggregates: false,
      },
      physical: {
        column: [],
        connection: {
          id: "connection id",
        },
        immutable: "",
      },
    };

    return new XmlDatasetBuilder(defaultData);
  }

  with(data: Partial<IXmlDataset>): XmlDatasetBuilder {
    return super.with(data) as XmlDatasetBuilder;
  }

  addLogical(dataset: Partial<IXmlDatasetLogical> = {}): XmlDatasetBuilder {
    const defaultData: IXmlDatasetLogical = {
      keyRef: [],
      attributeRef: [],
    };

    const newLogical = Object.assign({}, defaultData, dataset);

    return this.with({ logical: newLogical });
  }
}
