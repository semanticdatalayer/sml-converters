import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { IXmlCube } from "../../xml/IXmlCube";
import { IXmlDataSetRef } from "../../xml/IXmlDataset";
import { XmlDefaultAggregationType } from "../../xml/IXmlMeasure";
import { IXmlProjectAttribute } from "../../xml/IXmlProjectAttribute";

export default class XmlCubeBuilder extends AnyObjectBuilder<IXmlCube> {
  static create(): XmlCubeBuilder {
    const basicCube: IXmlCube = {
      name: "name",
      id: "uuid",
    };

    return new XmlCubeBuilder(basicCube);
  }

  addAttribute(attribute?: Partial<IXmlProjectAttribute>): XmlCubeBuilder {
    const defaultAttribute: IXmlProjectAttribute = {
      id: "id",
      name: "name",
      properties: { visible: true, type: { measure: { defaultAggregation: XmlDefaultAggregationType.Sum } } },
      yamlColumnName: "",
      yamlDataset: "",
    };

    const newAttribute = Object.assign(defaultAttribute, attribute);
    const attributes = { attribute: [newAttribute] };

    return this.with({ attributes });
  }

  addDataset(dataset?: Partial<IXmlDataSetRef>): XmlCubeBuilder {
    const defaultDataset: IXmlDataSetRef = {
      id: "id",
      yamlUniqueName: "yamlUniqueName",
    };

    const newDataset = Object.assign({}, defaultDataset, dataset);

    return this.with({ datasets: [...(this.clonedData.datasets || []), newDataset] });
  }

  with(data: Partial<IXmlCube>): XmlCubeBuilder {
    return super.with(data) as XmlCubeBuilder;
  }
}
