import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IYamlPackage } from "../../yaml/IYamlPackageFile";
import { YamlPackageBuilder } from "./YamlPackageBuilder";

export class YamlPackagesBuilder extends AnyObjectBuilder<IYamlPackage[]> {
  static create(): YamlPackagesBuilder {
    return new YamlPackagesBuilder([]);
  }

  public with(data: Partial<IYamlPackage[]>): YamlPackagesBuilder {
    return super.with(data) as YamlPackagesBuilder;
  }

  addPackage(data: Partial<IYamlPackage>): YamlPackagesBuilder {
    const pkg = YamlPackageBuilder.create().with(data).build();
    const packages = [...this.clonedData, pkg];

    return new YamlPackagesBuilder(packages);
  }
}
