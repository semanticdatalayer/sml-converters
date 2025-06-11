import { FolderStructureBuilder } from "utils/builders/FolderStructureBuilder";

import { CompilerValidator } from "../CompilerValidator/CompilerValidator";
import RepoValidator from "./RepoValidator";

const repoValidator = new RepoValidator();

const addValidatorMock = jest.spyOn(CompilerValidator.prototype, "addValidator").mockReturnThis();

jest.spyOn(CompilerValidator.prototype, "addRequiredValidator").mockReturnThis();

const rootFolder = FolderStructureBuilder.create("/");

describe("RepoValidator.validateYamlFiles", () => {
  it("Should add every validator when isGlobalSettingsRepo is false", () => {
    const isGlobalSettingsRepo = false;
    repoValidator.validateYamlFiles([], rootFolder.build(), isGlobalSettingsRepo);

    expect(addValidatorMock.mock.calls.length).toBeGreaterThan(1);
  });

  it("Should add only global settings validator when isGlobalSettingsRepo is true", () => {
    const isGlobalSettingsRepo = true;
    repoValidator.validateYamlFiles([], rootFolder.build(), isGlobalSettingsRepo);

    expect(addValidatorMock).toHaveBeenCalledTimes(1);
  });
});
