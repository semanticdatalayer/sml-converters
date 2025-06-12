import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { SMLPackage } from "sml-sdk";
import { YamlPackageBuilder } from "./YamlPackageBuilder";

export class YamlPackagesBuilder extends AnyObjectBuilder<SMLPackage[]> {
  static create(): YamlPackagesBuilder {
    return new YamlPackagesBuilder([]);
  }

  public with(data: Partial<SMLPackage[]>): YamlPackagesBuilder {
    return super.with(data) as YamlPackagesBuilder;
  }

  addPackage(data: Partial<SMLPackage>): YamlPackagesBuilder {
    const pkg = YamlPackageBuilder.create().with(data).build();
    const packages = [...this.clonedData, pkg];

    return new YamlPackagesBuilder(packages);
  }
}
