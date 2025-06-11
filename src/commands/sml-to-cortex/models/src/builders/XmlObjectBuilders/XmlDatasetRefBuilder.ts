import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IXmlDataSetRef } from "../../xml/IXmlDataset";
import { IXmlDatasetLogical } from "../../xml/IXmlDatasetLogical";

export default class XmlDataSetRefBuilder extends AnyObjectBuilder<IXmlDataSetRef> {
  static create() {
    const defaultData: IXmlDataSetRef = {
      id: "datasetTestId",
      yamlUniqueName: "dataset",
    };

    return new XmlDataSetRefBuilder(defaultData);
  }

  with(data: Partial<IXmlDataSetRef>): XmlDataSetRefBuilder {
    return super.with(data) as XmlDataSetRefBuilder;
  }

  addLogical(dataset: Partial<IXmlDatasetLogical> = {}): XmlDataSetRefBuilder {
    const defaultData: IXmlDatasetLogical = {
      keyRef: [],
      attributeRef: [],
    };

    const newLogical = Object.assign({}, defaultData, dataset);

    return this.with({ logical: newLogical });
  }
}
