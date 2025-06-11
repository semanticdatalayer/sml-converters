import YamlCatalogBuilder from "models/src/builders/YamlObjectBuilders/YamlCatalogBuilder";
import { IFile } from "models/src/IFile";
import { IFolderStructure } from "models/src/IFolderStructure";
import { ObjectType } from "models/src/ObjectType";
import { OriginType } from "models/src/SourceType";
import { IYamlCatalog } from "models/src/yaml/IYamlCatalog";

import {
  catalogFileErrors,
  catalogFileWarnings,
  YamlGlobalFolderStructureValidator,
} from "./YamlGlobalFolderStructureValidator";

const catalogBuilder = YamlCatalogBuilder.create();
const validator = YamlGlobalFolderStructureValidator.create();
let rootFolder: IFolderStructure<IFile>;

describe("YamlGlobalFolderStructureValidator", () => {
  beforeEach(() => {
    rootFolder = {
      files: [],
      folders: [],
    } as unknown as IFolderStructure<IFile>;
  });

  it("Should not return a global error if a file with the name 'catalog' exists in the root folder", () => {
    rootFolder.files.push(catalogBuilder.buildYamlFile("catalog"));
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.globalOutput).toHaveLength(0);
  });

  it("Should return a global error if a file with the name 'catalog' does not exist in the root folder", () => {
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.hasGlobalMessage(catalogFileErrors.missing)).toBeTruthy();
  });

  it("Should return a global error if files with the name 'catalog' exist more than once in the root folder", () => {
    rootFolder.files.push(catalogBuilder.buildYamlFile("catalog"));
    rootFolder.files.push(catalogBuilder.buildYamlFile("catalog"));
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.hasGlobalMessage(catalogFileErrors.moreThanOne)).toBeTruthy();
  });

  it("Should return a global error if files with the name 'atscale' exist more than once in the root folder", () => {
    rootFolder.files.push(catalogBuilder.buildYamlFile("atscale"));
    rootFolder.files.push(catalogBuilder.buildYamlFile("atscale"));
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.hasGlobalMessage(catalogFileErrors.moreThanOne)).toBeTruthy();
  });

  it("Should return an error if a file with the name 'catalog' exists in a subfolder", () => {
    const subFolder = {
      path: "test/",
      folders: [],
      files: [catalogBuilder.buildYamlFile("atscale/catalog")],
    } as unknown as IFolderStructure<IFile>;

    rootFolder.files.push(catalogBuilder.buildYamlFile("catalog"));
    rootFolder.folders.push(subFolder);
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.globalOutput).toHaveLength(0);
    expect(validationOutput.hasFileErrorMessage(catalogFileErrors.notInRoot)).toBeTruthy();
  });

  it("Should return an warning if a file with the name 'atscale' exists in a subfolder", () => {
    const subFolder = {
      path: "test/",
      folders: [],
      files: [catalogBuilder.buildYamlFile("atscale/atscale")],
    } as unknown as IFolderStructure<IFile>;

    rootFolder.files.push(catalogBuilder.buildYamlFile("atscale"));
    rootFolder.folders.push(subFolder);
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.globalOutput).toHaveLength(1);
    expect(validationOutput.hasFileErrorMessage(catalogFileErrors.notInRoot)).toBeTruthy();
  });

  const packagesTest: { text: string; origin: OriginType }[] = [
    { text: "Package", origin: OriginType.Package },
    { text: "PackagesRoot", origin: OriginType.PackagesRoot },
  ];

  packagesTest.forEach((t) => {
    it(`Should NOT return an error if a file with the name 'catalog' has originType "${t.text}"`, () => {
      const packageFolder: IFolderStructure<IFile> = {
        path: "packages/",
        folders: [],
        files: [catalogBuilder.buildYamlFileForPackage("packages/shared/catalog")],
        origin: t.origin,
        packageName: "shared",
      };

      rootFolder.files.push(catalogBuilder.buildYamlFile("catalog"));
      rootFolder.folders.push(packageFolder);
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.globalOutput).toHaveLength(0);
      expect(validationOutput.hasFileErrorMessage(catalogFileErrors.notInRoot)).toBe(false);
    });
  });

  describe("Should return an error if a file with object_type 'catalog' has a name different than catalog.yml/yaml or atscale.yml/yaml", () => {
    it("in the root folder 'catalog'", () => {
      rootFolder.files.push(catalogBuilder.buildYamlFile("catalog"));
      rootFolder.files.push(catalogBuilder.buildYamlFile("test"));
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.hasFileErrorMessage(catalogFileErrors.notCorrectFileName)).toBeTruthy();
    });

    it("in the subfolder 'catalog'", () => {
      rootFolder.files.push(catalogBuilder.buildYamlFile("catalog"));
      const subFolder = {
        path: "test/",
        folders: [],
        files: [catalogBuilder.buildYamlFile("catalog/test")],
      } as unknown as IFolderStructure<IFile>;
      rootFolder.folders.push(subFolder);
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.hasFileErrorMessage(catalogFileErrors.notCorrectFileName)).toBeTruthy();
    });

    it("in the root folder 'atscale'", () => {
      rootFolder.files.push(catalogBuilder.buildYamlFile("atscale"));
      rootFolder.files.push(catalogBuilder.buildYamlFile("test"));
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.hasFileErrorMessage(catalogFileErrors.notCorrectFileName)).toBeTruthy();
    });

    it("in the subfolder 'atscale'", () => {
      rootFolder.files.push(catalogBuilder.buildYamlFile("atscale"));
      const subFolder = {
        path: "test/",
        folders: [],
        files: [catalogBuilder.buildYamlFile("atscale/test")],
      } as unknown as IFolderStructure<IFile>;
      rootFolder.folders.push(subFolder);
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.hasFileErrorMessage(catalogFileErrors.notCorrectFileName)).toBeTruthy();
    });
  });

  it("Should return an error if a file with the name 'catalog' does not have an object_type", () => {
    const file = catalogBuilder.buildYamlFile("catalog");
    delete (file.data as Partial<IYamlCatalog>).object_type;
    rootFolder.files.push(file);
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.hasFileErrorMessage(catalogFileErrors.objectTypeMissing)).toBeTruthy();
  });

  it("Should return an error if a file with the name 'atscale' does not have an object_type", () => {
    const file = catalogBuilder.buildYamlFile("atscale");
    delete (file.data as Partial<IYamlCatalog>).object_type;
    rootFolder.files.push(file);
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.hasFileErrorMessage(catalogFileErrors.objectTypeMissing)).toBeTruthy();
  });

  it("Should return an error if a file with the name 'catalog' has an object_type different than 'catalog'", () => {
    const file = catalogBuilder.buildYamlFile("catalog");
    file.data.object_type = ObjectType.Model;
    rootFolder.files.push(file);
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.hasFileErrorMessage(catalogFileErrors.notCorrectObjType)).toBeTruthy();
  });

  it("Should return an error if a file with the name 'atscale' has an object_type different than 'catalog'", () => {
    const file = catalogBuilder.buildYamlFile("atscale");
    file.data.object_type = ObjectType.Model;
    rootFolder.files.push(file);
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.hasFileErrorMessage(catalogFileErrors.notCorrectObjType)).toBeTruthy();
  });

  it("Should return a global error if files with the name 'atscale' and 'catalog' exists in the root folder", () => {
    rootFolder.files.push(catalogBuilder.buildYamlFile("catalog"));
    rootFolder.files.push(catalogBuilder.buildYamlFile("atscale"));
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.globalOutput).toHaveLength(2);
    expect(validationOutput.hasGlobalMessage(catalogFileErrors.moreThanOne)).toBeTruthy();
    expect(validationOutput.hasGlobalMessage(catalogFileWarnings.atscaleFileDeprecated)).toBeTruthy();
  });

  it("Should return a global warning if a file with the name 'atscale' exists in the root folder and 'catalog' file not exist", () => {
    rootFolder.files.push(catalogBuilder.buildYamlFile("atscale"));
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.globalOutput).toHaveLength(1);
    expect(validationOutput.hasGlobalMessage(catalogFileWarnings.atscaleFileDeprecated)).toBeTruthy();
  });

  it("Should not return a global warning if a file with the name 'atscale' does not exist in the root folder", () => {
    rootFolder.files.push(catalogBuilder.buildYamlFile("catalog"));
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.globalOutput).toHaveLength(0);
  });
});
