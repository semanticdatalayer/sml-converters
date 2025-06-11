import { ObjectType } from "../../ObjectType";
import { IYamlCatalog } from "../../yaml/IYamlCatalog";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class YamlCatalogBuilder extends YamlObjectBuilder<IYamlCatalog, YamlCatalogBuilder> {
  static create(): YamlCatalogBuilder {
    const defaultData: IYamlCatalog = {
      aggressive_agg_promotion: false,
      version: 1.0,
      build_speculative_aggs: true,
      label: "Test Lots Of Features",
      object_type: ObjectType.Catalog,
      unique_name: "TestLotsOfFeatures",
    };

    return new YamlCatalogBuilder(defaultData);
  }
}
