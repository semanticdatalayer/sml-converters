import { YamlPackageBuilder } from "models/src/builders/YamlObjectBuilders/YamlPackageBuilder";
import { IYamlPackageFile } from "models/src/yaml/IYamlPackageFile";

import FileServiceBuilder from "../builders/FileServiceBuilder";
import LoggerServiceBuilder from "../builders/LoggerServiceBuilder";
import { PackageDiffBuilder } from "./PackageDiffBuilder";
import { PackageParser } from "./PackagesParser";

const loggerBuilder = LoggerServiceBuilder.create();

const getDefaultPackageParser = () => {
  const fileService = FileServiceBuilder.create();

  return new PackageParser(fileService.build(), loggerBuilder.build());
};
describe("PackageParser.parsePackageConfig", () => {
  it("should correctly parse YamlPackageFile", () => {
    const packageFileContent = `packages:
  - name: shared
    url: https://github.com/AtScaleInc/sml-demo-shared-objects.git
    branch: main
    version: commit:f9b8ae1d7cfb032a33486efd2bc717d7770d9aa1
version: 1`;
    const fileService = FileServiceBuilder.create();
    const parser = new PackageParser(fileService.build(), loggerBuilder.build());
    const expectedResult: IYamlPackageFile = {
      packages: [
        {
          branch: "main",
          name: "shared",
          url: "https://github.com/AtScaleInc/sml-demo-shared-objects.git",
          version: "commit:f9b8ae1d7cfb032a33486efd2bc717d7770d9aa1",
        },
      ],
      version: 1,
    };
    const result = parser.parsePackageConfig(packageFileContent);

    expect(result).toStrictEqual(expectedResult);
  });
});
describe("PackageParser.getPackages", () => {
  it("in case packages file doesn't exist should return an empty collection", async () => {
    const readfileSpy = jest.fn();
    const fileService = FileServiceBuilder.create()
      .doesFileExist.resolve(false)
      .readFile.implementation(readfileSpy)
      .build();
    const parser = new PackageParser(fileService, loggerBuilder.build());
    const result = await parser.getPackages("");

    expect(result).toEqual([]);
    expect(readfileSpy).toHaveBeenCalledTimes(0);
  });
  it("if packages file exists - should correctly parse and return packages", async () => {
    const packageFileContent = `packages:
  - name: shared
    url: https://github.com/AtScaleInc/sml-demo-shared-objects.git
    branch: main
    version: commit:f9b8ae1d7cfb032a33486efd2bc717d7770d9aa1
version: 1`;

    const fileService = FileServiceBuilder.create()
      .doesFileExist.resolve(true)
      .readFile.resolve(packageFileContent)
      .build();

    const parser = new PackageParser(fileService, loggerBuilder.build());
    const result = await parser.getPackages("");
    const expectedResult = [
      {
        branch: "main",
        name: "shared",
        url: "https://github.com/AtScaleInc/sml-demo-shared-objects.git",
        version: "commit:f9b8ae1d7cfb032a33486efd2bc717d7770d9aa1",
      },
    ];

    expect(result).toEqual(expectedResult);
  });
});

describe("PackageParser.getPackageRepoPath", () => {
  it("suffix _submodule is added for submodules repo paths", () => {
    const fileService = FileServiceBuilder.create();

    const parser = new PackageParser(fileService.build(), loggerBuilder.build());

    const path = parser.getPackageRepoPath("rootRepo", "my-repo");
    expect(path).toStrictEqual(`/rootRepomy-repo_package`);
  });
});
describe("PackageParser.getPackagesDiff", () => {
  it("Should return empty collections in case two packages collections are equal", () => {
    const pkg1 = YamlPackageBuilder.create().withTestIdentifier("pkg1").build();
    const pkg2 = YamlPackageBuilder.create().withTestIdentifier("pkg2").build();
    const emptyPackageDiff = PackageDiffBuilder.create().build();
    const parser = getDefaultPackageParser();
    const result = parser.getPackagesDiff([pkg1, pkg2], [pkg2, pkg1]);
    expect(result).toStrictEqual(emptyPackageDiff);
  });
  it("Should return added packages in case incoming packages has added items", () => {
    const pkg1 = YamlPackageBuilder.create().withTestIdentifier("pkg1").build();
    const pkg2 = YamlPackageBuilder.create().withTestIdentifier("pkg2").build();
    const pkg3 = YamlPackageBuilder.create().withTestIdentifier("pkg3").build();

    const parser = getDefaultPackageParser();
    const result = parser.getPackagesDiff([pkg1, pkg2], [pkg2, pkg1, pkg3]);
    expect(result.added).toStrictEqual([pkg3]);
    expect(result.deleted.length).toEqual(0);
    expect(result.modified.length).toEqual(0);
  });
  it("Should return deleted packages in case incoming packages has removed items", () => {
    const pkg1 = YamlPackageBuilder.create().withTestIdentifier("pkg1").build();
    const pkg2 = YamlPackageBuilder.create().withTestIdentifier("pkg2").build();

    const parser = getDefaultPackageParser();
    const result = parser.getPackagesDiff([pkg1, pkg2], [pkg2]);
    expect(result.deleted).toStrictEqual([pkg1]);
    expect(result.added.length).toEqual(0);
    expect(result.modified.length).toEqual(0);
  });
  it("Should return modified packages in case incoming packages has modified items", () => {
    const pkg1 = YamlPackageBuilder.create().withTestIdentifier("pkg1").build();
    const pkg2 = YamlPackageBuilder.create().withTestIdentifier("pkg2").build();
    const pkg3 = YamlPackageBuilder.create().withTestIdentifier("pkg2").with({ url: "changed" }).build();

    const parser = getDefaultPackageParser();
    const result = parser.getPackagesDiff([pkg1, pkg2], [pkg1, pkg3]);
    expect(result.deleted.length).toEqual(0);
    expect(result.added.length).toEqual(0);
    expect(result.modified).toEqual([pkg3]);
  });
  it("Should return all changes in packages", () => {
    const pkg1 = YamlPackageBuilder.create().withTestIdentifier("pkg1").build();
    const pkg2 = YamlPackageBuilder.create().withTestIdentifier("pkg2").build();
    const pkg3 = YamlPackageBuilder.create().withTestIdentifier("pkg2").with({ url: "changed" }).build();
    const pkg4 = YamlPackageBuilder.create().withTestIdentifier("pkg4").build();
    const pkg5 = YamlPackageBuilder.create().withTestIdentifier("pkg4").with({ branch: "newBranch" }).build();
    const pkg6 = YamlPackageBuilder.create().withTestIdentifier("pkg6").build();

    const parser = getDefaultPackageParser();
    const result = parser.getPackagesDiff([pkg6, pkg2, pkg4], [pkg1, pkg3, pkg5]);
    expect(result.deleted).toEqual([pkg6]);
    expect(result.added).toEqual([pkg1]);

    expect(result.modified).toEqual([pkg3, pkg5]);
  });
});

describe("PackageParser.arePackagesEqual", () => {
  it("Should return true if objects are equal", () => {
    const parser = getDefaultPackageParser();
    const source = YamlPackageBuilder.create().withTestIdentifier("pkg1").build();
    const target = YamlPackageBuilder.create().withTestIdentifier("pkg1").build();
    const result = parser.arePackagesEqual(source, target);
    expect(result).toEqual(true);
  });
  it("Should return false if objects differ only on one prop value", () => {
    const parser = getDefaultPackageParser();
    const source = YamlPackageBuilder.create().withTestIdentifier("pkg1").build();
    const target = YamlPackageBuilder.create().withTestIdentifier("pkg1").with({ branch: "new" }).build();
    const result = parser.arePackagesEqual(source, target);
    expect(result).toEqual(false);
  });
  it("Should return false if objects are not equal", () => {
    const parser = getDefaultPackageParser();
    const source = YamlPackageBuilder.create().withTestIdentifier("pkg1").build();
    const target = YamlPackageBuilder.create().withTestIdentifier("pkg2").build();
    const result = parser.arePackagesEqual(source, target);
    expect(result).toEqual(false);
  });
});
