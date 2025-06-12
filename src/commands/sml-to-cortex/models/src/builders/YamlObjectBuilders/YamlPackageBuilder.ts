import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

// import { IYamlPackage, IYamlPackageChange } from "../../yaml/IYamlPackageFile";

import {SMLPackage, SMLPackageChange} from "sml-sdk"

export class YamlPackageBuilder extends AnyObjectBuilder<SMLPackage> {
  static create(): YamlPackageBuilder {
    const defaultData: SMLPackage = {
      url: "http://shared-repo.git",
      name: "shared",
      branch: "develop",
      version: "1",
    };

    return new YamlPackageBuilder(defaultData);
  }

  public with(data: Partial<SMLPackage>): YamlPackageBuilder {
    return super.with(data) as YamlPackageBuilder;
  }

  public version(v: string): YamlPackageBuilder {
    return this.with({ version: v });
  }

  public name(name: string): YamlPackageBuilder {
    return this.with({ name: name });
  }

  public withTestIdentifier(id: string): YamlPackageBuilder {
    return this.with({
      branch: `branch-${id}`,
      name: id,
      url: `url-${id}`,
      version: `commit-${id}`,
    }) as YamlPackageBuilder;
  }

  static newCommit(name: string, commit: string): SMLPackageChange {
    return { name, commit };
  }
}
