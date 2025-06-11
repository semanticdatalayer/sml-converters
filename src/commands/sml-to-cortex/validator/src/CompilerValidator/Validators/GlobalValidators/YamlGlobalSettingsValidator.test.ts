import { YamlGlobalSettingsBuilder } from "models/src/builders/YamlObjectBuilders/YamlGlobalSettingsBuilder";
import { IFile } from "models/src/IFile";
import { IFolderStructure } from "models/src/IFolderStructure";
import { ObjectType } from "models/src/ObjectType";
import { IYamlCatalog } from "models/src/yaml/IYamlCatalog";

import { globalSettingsFileErrors, YamlGlobalSettingsValidator } from "./YamlGlobalSettingsValidator";

const catalogBuilder = YamlGlobalSettingsBuilder.create();
const validator = YamlGlobalSettingsValidator.create(true);
let rootFolder: IFolderStructure<IFile>;

describe("YamlGlobalFolderStructureValidator", () => {
  beforeEach(() => {
    rootFolder = {
      files: [],
      folders: [],
    } as unknown as IFolderStructure<IFile>;
  });

  describe("In a settings repo", () => {
    it("Should not return a global error if a file with the name 'global_settings' exists in the root folder", () => {
      rootFolder.files.push(catalogBuilder.buildYamlFile("global_settings"));
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.globalOutput).toHaveLength(0);
    });

    it("Should return a global error if a file with the name 'global_settings' does not exist in the root folder", () => {
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.hasGlobalMessage(globalSettingsFileErrors.missing)).toBeTruthy();
    });

    it("Should return a global error if files with the name 'global_settings' exist more than once in the root folder", () => {
      rootFolder.files.push(catalogBuilder.buildYamlFile("global_settings"));
      rootFolder.files.push(catalogBuilder.buildYamlFile("global_settings"));
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.hasGlobalMessage(globalSettingsFileErrors.moreThanOne)).toBeTruthy();
    });

    it("Should return an error if a file with the name 'global_settings' exists in a subfolder", () => {
      const subFolder = {
        path: "test/",
        folders: [],
        files: [catalogBuilder.buildYamlFile("atscale/global_settings")],
      } as unknown as IFolderStructure<IFile>;

      rootFolder.files.push(catalogBuilder.buildYamlFile("global_settings"));
      rootFolder.folders.push(subFolder);
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.globalOutput).toHaveLength(0);
      expect(validationOutput.hasFileErrorMessage(globalSettingsFileErrors.notInRoot)).toBeTruthy();
    });
  });

  describe("Not in settings reop", () => {
    const notInSettingsRepoValidator = YamlGlobalSettingsValidator.create(false);

    it("Should return a global error if global settings file exists", () => {
      rootFolder.files.push(catalogBuilder.buildYamlFile("global_settings"));

      const validationOutput = notInSettingsRepoValidator.validateFolderStructure(rootFolder);

      expect(validationOutput.hasGlobalMessage(globalSettingsFileErrors.exists)).toBeTruthy();
    });

    it("Should return no global error if no global settings file exists", () => {
      const validationOutput = notInSettingsRepoValidator.validateFolderStructure(rootFolder);

      expect(validationOutput.globalOutput).toHaveLength(0);
    });
  });

  describe("Should return an error if a file with object_type 'global_settings' has a name different than global_settings.yml/yaml", () => {
    it("in the root folder 'global_settings'", () => {
      rootFolder.files.push(catalogBuilder.buildYamlFile("global_settings"));
      rootFolder.files.push(catalogBuilder.buildYamlFile("test"));
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.hasFileErrorMessage(globalSettingsFileErrors.notCorrectFileName)).toBeTruthy();
      expect(validationOutput.hasGlobalMessage(globalSettingsFileErrors.otherYamlFiles)).toBeTruthy();
    });

    it("in the subfolder 'global_settings'", () => {
      rootFolder.files.push(catalogBuilder.buildYamlFile("global_settings"));
      const subFolder = {
        path: "test/",
        folders: [],
        files: [catalogBuilder.buildYamlFile("catalog/test")],
      } as unknown as IFolderStructure<IFile>;
      rootFolder.folders.push(subFolder);
      const validationOutput = validator.validateFolderStructure(rootFolder);

      expect(validationOutput.hasFileErrorMessage(globalSettingsFileErrors.notCorrectFileName)).toBeTruthy();
    });
  });

  it("Should return an error if a file with the name 'global_settings' does not have an object_type", () => {
    const file = catalogBuilder.buildYamlFile("global_settings");
    delete (file.data as Partial<IYamlCatalog>).object_type;
    rootFolder.files.push(file);
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.hasFileErrorMessage(globalSettingsFileErrors.objectTypeMissing)).toBeTruthy();
  });

  it("Should return an error if a file with the name 'global_settings' has an object_type different than 'global_settings'", () => {
    const file = catalogBuilder.buildYamlFile("global_settings");
    file.data.object_type = ObjectType.Model;
    rootFolder.files.push(file);
    const validationOutput = validator.validateFolderStructure(rootFolder);

    expect(validationOutput.hasFileErrorMessage(globalSettingsFileErrors.notCorrectObjType)).toBeTruthy();
  });
});
