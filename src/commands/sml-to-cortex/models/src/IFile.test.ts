import { FolderStructureBuilder } from "utils/builders/FolderStructureBuilder";

import { isFileReadOnly, isFolderPackagesRoot } from "./IFile";
import { OriginType } from "./SourceType";

describe("IFile isFileReadOnly tests", () => {
  it(`when origin is ${OriginType.Package} then folder is readonly`, () => {
    const folder = FolderStructureBuilder.create("/").with({ origin: OriginType.Package }).build();

    const isReadOnly = isFileReadOnly(folder);

    expect(isReadOnly).toStrictEqual(true);
  });

  it(`when origin is ${OriginType.PackagesRoot} then folder is readonly`, () => {
    const folder = FolderStructureBuilder.create("/").with({ origin: OriginType.PackagesRoot }).build();

    const isReadOnly = isFileReadOnly(folder);

    expect(isReadOnly).toStrictEqual(true);
  });

  it(`when origin is ${OriginType.Root} then folder is not readonly`, () => {
    const folder = FolderStructureBuilder.create("/").with({ origin: OriginType.Root }).build();

    const isReadOnly = isFileReadOnly(folder);

    expect(isReadOnly).toStrictEqual(false);
  });
});

describe("IFile isFolderPackagesRoot tests", () => {
  it(`when origin is ${OriginType.PackagesRoot} then isFolderPackagesRoot is true`, () => {
    const folder = FolderStructureBuilder.create("/").with({ origin: OriginType.PackagesRoot }).build();

    const isReadOnly = isFolderPackagesRoot(folder);

    expect(isReadOnly).toStrictEqual(true);
  });

  it(`when origin is ${OriginType.Package} then isFolderPackagesRoot is false`, () => {
    const folder = FolderStructureBuilder.create("/").with({ origin: OriginType.Package }).build();

    const isReadOnly = isFolderPackagesRoot(folder);

    expect(isReadOnly).toStrictEqual(false);
  });
});
