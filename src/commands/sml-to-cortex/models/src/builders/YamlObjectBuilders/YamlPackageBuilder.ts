import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IYamlPackage, IYamlPackageChange } from "../../yaml/IYamlPackageFile";

export class YamlPackageBuilder extends AnyObjectBuilder<IYamlPackage> {
  static create(): YamlPackageBuilder {
    const defaultData: IYamlPackage = {
      url: "http://shared-repo.git",
      name: "shared",
      branch: "develop",
      version: "1",
    };

    return new YamlPackageBuilder(defaultData);
  }

  public with(data: Partial<IYamlPackage>): YamlPackageBuilder {
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

  static newCommit(name: string, commit: string): IYamlPackageChange {
    return { name, commit };
  }
}
