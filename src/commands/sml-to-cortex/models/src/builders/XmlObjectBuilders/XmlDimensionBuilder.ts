import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { IXmlDimension } from "../../xml/IXmlDimension";
import { IXmlHierarchy, IXmlLevel } from "../../xml/IXmlHierarchy";

export default class XmlDimensionBuilder extends AnyObjectBuilder<IXmlDimension> {
  static create(): XmlDimensionBuilder {
    const dimensionContainer: IXmlDimension = {
      id: "id",
      name: "yamlUniqueName",
      hierarchies: [],
      // TODO: research how to set on false in current UI. We do not have yaml visible prop.
      properties: { visible: true },
    };

    return new XmlDimensionBuilder(dimensionContainer);
  }

  with(data: Partial<IXmlDimension>): XmlDimensionBuilder {
    return super.with(data) as XmlDimensionBuilder;
  }

  addHierarchy(hierarchy?: Partial<IXmlHierarchy>): XmlDimensionBuilder {
    const defaultHierarchyValues: IXmlHierarchy = {
      id: "id",
      name: "name",
      properties: { visible: true },
      levels: [],
    };

    const newHierarchy = Object.assign(defaultHierarchyValues, hierarchy);

    return this.with({ hierarchies: [...this.clonedData.hierarchies, newHierarchy] });
  }

  addLevel(level?: Partial<IXmlLevel>, hierarchyIndex?: number): XmlDimensionBuilder {
    const defaultLevelValues: IXmlLevel = {
      primaryAttribute: "id",
      properties: { visible: true, uniqueInParent: false },
      yamlUniqueName: "yamlUniqueName",
    };

    if (!hierarchyIndex) {
      hierarchyIndex = 0;
    }

    const newLevel = Object.assign(defaultLevelValues, level);
    const hierarchies = this.clonedData.hierarchies;
    hierarchies[hierarchyIndex].levels.push(newLevel);

    return this.with({ hierarchies });
  }
}
