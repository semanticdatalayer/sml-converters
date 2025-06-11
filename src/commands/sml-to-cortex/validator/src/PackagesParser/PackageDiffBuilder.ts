import { YamlPackageBuilder } from "models/src/builders/YamlObjectBuilders/YamlPackageBuilder";
import { IYamlPackage } from "models/src/yaml/IYamlPackageFile";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IPackageDiff } from "./PackagesParser";

const emptyPackageDiff: IPackageDiff = {
  added: [],
  modified: [],
  deleted: [],
};
export class PackageDiffBuilder extends AnyObjectBuilder<IPackageDiff> {
  static create(): PackageDiffBuilder {
    return new PackageDiffBuilder(emptyPackageDiff);
  }

  private getPackages(...ids: Array<string>): Array<IYamlPackage> {
    return ids.map((id) => YamlPackageBuilder.create().withTestIdentifier(id).build());
  }
  public with(data: Partial<IPackageDiff>): PackageDiffBuilder {
    return super.with(data) as PackageDiffBuilder;
  }
  withModified(...ids: Array<string>) {
    return this.with({ modified: this.getPackages(...ids) });
  }
  withDeleted(...ids: Array<string>) {
    return this.with({ deleted: this.getPackages(...ids) });
  }
  withAdded(...ids: Array<string>) {
    return this.with({ added: this.getPackages(...ids) });
  }
}
