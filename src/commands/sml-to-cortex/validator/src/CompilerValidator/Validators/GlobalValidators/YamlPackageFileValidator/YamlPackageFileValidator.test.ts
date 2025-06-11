import { YamlPackageFileBuilder } from "models/src/builders/YamlObjectBuilders/YamlPackageFileBuilder";
import { IFile } from "models/src/IFile";
import { ICompilationOutput } from "models/src/IFileCompilationOutput";
import { IFolderStructure } from "models/src/IFolderStructure";
import { OriginType } from "models/src/SourceType";
import { IYamlPackage } from "models/src/yaml/IYamlPackageFile";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";
import { ObjectInvalidSchemaGenerator } from "utils/ObjectInvalidSchemaGenerator";

import { YamlPackageFileValidator, yamlPackageFileValidatorErrors } from "./YamlPackageFileValidator";

const packageFileValidator = YamlPackageFileValidator.create();
const packageFileBuilder = YamlPackageFileBuilder.create();

const packageBuilder = AnyObjectBuilder.fromPartial<IYamlPackage>({
  name: "test",
  url: "http://test.com",
  version: "commit:abcdef12345678",
  branch: "testBranch",
});

const hasErrorMessage = (results: Array<ICompilationOutput>, errorMessage: string): boolean => {
  return results.some((result) => result.message === errorMessage);
};

const generateValidUniqueName = (index: number): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return `test${(index + "").replace(/\d/g, (c: any) => "JABCDEFGHI"[c])}`;
};

const notCorrectNameVariants = ["", "test1", "te st", "test/", "test."];
const notCorrectUrlVariants = ["testUrl", "http:test.com", "http:/test.com", "http/:test.com", "ftp://test.com"];
const notCorrectVersionVariants = [
  "test version",
  "commit version",
  "commitVersion",
  "commit:test",
  "commit:test12342134123432423423",
];

describe("YamlPackageFileValidator", () => {
  describe("validateFolderStructure", () => {
    it("Should trigger validate, if root folder has package.yml file", () => {
      const validator = YamlPackageFileValidator.create();
      validator.validate = jest.fn().mockReturnValue([]);

      const yamlPackageFile = packageFileBuilder.buildYamlFile();
      const rootFolder: IFolderStructure<IFile> = {
        files: [yamlPackageFile],
        path: "",
        folders: [],
        origin: OriginType.Root,
        packageName: "",
      };

      validator.validateFolderStructure(rootFolder);
      expect(validator.validate).toHaveBeenCalled();
    });

    it("Should not trigger validate, if root folder has not package.yml file", () => {
      const validator = YamlPackageFileValidator.create();
      validator.validate = jest.fn().mockReturnValue([]);

      const rootFolder: IFolderStructure<IFile> = {
        files: [],
        path: "",
        folders: [],
        origin: OriginType.Root,
        packageName: "",
      };

      validator.validateFolderStructure(rootFolder);
      expect(validator.validate).toHaveBeenCalledTimes(0);
    });
  });

  describe("validate", () => {
    it("Should have valid package file", () => {
      const editedPackageFileMock = packageFileBuilder.build();
      const result = packageFileValidator.validate(editedPackageFileMock);

      expect(result).toHaveLength(0);
    });

    it("Should show a correct error message, if some of the package names are not unique", () => {
      const keyName = "name";
      const packageMock = packageBuilder.build();
      const packageMock2 = packageBuilder.with({ url: "http://test1.com" }).build();

      const editedPackageFileMock = packageFileBuilder.with({ packages: [packageMock, packageMock2] }).build();
      const result = packageFileValidator.validate(editedPackageFileMock);
      expect(result).toHaveLength(2);
      expect(
        hasErrorMessage(
          result,
          yamlPackageFileValidatorErrors.packagePropValueShouldBeUnique(packageMock[keyName], keyName)
        )
      ).toBeTruthy();
    });

    it("Should show a correct error message, if some of the package names are not correct", () => {
      const packageMock = packageBuilder.with({ name: "test with spaces" }).build();
      const editedPackageFileMock = packageFileBuilder.with({ packages: [packageMock] }).build();

      const result = packageFileValidator.validate(editedPackageFileMock);
      expect(result).toHaveLength(1);
      expect(
        hasErrorMessage(result, yamlPackageFileValidatorErrors.packageNameShouldBeCorrect(packageMock.name))
      ).toBeTruthy();
    });

    it("Should not show error message, if url is valid", () => {
      const packageMock = packageBuilder.with({ url: "http://test.me/repo" }).build();
      const editedPackageFileMock = packageFileBuilder.with({ packages: [packageMock] }).build();
      const result = packageFileValidator.validate(editedPackageFileMock);

      expect(result).toHaveLength(0);
    });

    it("Should show a correct error message, if some of the package urls are not unique", () => {
      const keyName = "url";
      const packageMock = packageBuilder.build();
      const packageMock2 = packageBuilder.with({ name: "testt" }).build();
      const editedPackageFileMock = packageFileBuilder.with({ packages: [packageMock, packageMock2] }).build();

      const result = packageFileValidator.validate(editedPackageFileMock);
      expect(result).toHaveLength(2);
      expect(
        hasErrorMessage(
          result,
          yamlPackageFileValidatorErrors.packagePropValueShouldBeUnique(packageMock[keyName], keyName)
        )
      ).toBeTruthy();
    });

    it("Should show a correct error message, if some of the package urls are not correct", () => {
      const packageMock = packageBuilder.with({ url: "http:test.com" }).build();
      const editedPackageFileMock = packageFileBuilder.with({ packages: [packageMock] }).build();

      const result = packageFileValidator.validate(editedPackageFileMock);
      expect(result).toHaveLength(1);
      expect(hasErrorMessage(result, yamlPackageFileValidatorErrors.packageUrlShouldBeCorrect(packageMock.name)));
    });

    it("Should show a correct error message, if some of the package versions are not correct", () => {
      const packageMock = packageBuilder.with({ version: "test" }).build();
      const editedPackageFileMock = packageFileBuilder.with({ packages: [packageMock] }).build();

      const result = packageFileValidator.validate(editedPackageFileMock);
      expect(result).toHaveLength(1);
      expect(
        hasErrorMessage(result, yamlPackageFileValidatorErrors.packageVersionShouldBeCorrect(packageMock.name))
      ).toBeTruthy();
    });

    it("Should generate correct count of error messages, if more than one packages names are not correct", () => {
      const notValidPackagesMocks: Array<IYamlPackage> = [];

      notCorrectNameVariants.forEach((variant, index) => {
        const notValidPackageMock = packageBuilder.with({ name: variant, url: `http://test${index}.com` }).build();
        notValidPackagesMocks.push(notValidPackageMock);
      });

      const editedPackageFileMock = packageFileBuilder.with({ packages: notValidPackagesMocks }).build();

      const result = packageFileValidator.validate(editedPackageFileMock);
      expect(result).toHaveLength(5);
    });

    it("Should generate correct count of error messages, if more than one packages urls are not correct", () => {
      const notValidPackagesMocks: Array<IYamlPackage> = [];

      notCorrectUrlVariants.forEach((variant, index) => {
        const mockedName = generateValidUniqueName(index);
        const notValidPackageMock = packageBuilder.with({ name: mockedName, url: variant }).build();
        notValidPackagesMocks.push(notValidPackageMock);
      });

      const editedPackageFileMock = packageFileBuilder.with({ packages: notValidPackagesMocks }).build();
      const result = packageFileValidator.validate(editedPackageFileMock);
      expect(result).toHaveLength(5);
    });

    it("Should generate correct count of error messages, if more than one packages versions are not correct", () => {
      const notValidPackagesMocks: Array<IYamlPackage> = [];

      notCorrectVersionVariants.forEach((variant, index) => {
        const mockedName = generateValidUniqueName(index);
        const mockedUrl = `http://test${index}.com`;
        const notValidPackageMock = packageBuilder.with({ name: mockedName, url: mockedUrl, version: variant }).build();
        notValidPackagesMocks.push(notValidPackageMock);
      });

      const editedPackageFileMock = packageFileBuilder.with({ packages: notValidPackagesMocks }).build();
      const result = packageFileValidator.validate(editedPackageFileMock);
      expect(result).toHaveLength(5);
    });

    it("Should generate correct count of error messages, if more than one package properties are not correct", () => {
      const notValidPackageMock = packageBuilder.with({ name: "not correct name", url: "http://test.com" }).build();
      const notValidPackageMock2 = packageBuilder.with({ name: "test-a", url: "not correct url" }).build();
      const notValidPackageMock3 = packageBuilder
        .with({ name: "test-b", url: "http://test1.com", version: "not correct version" })
        .build();

      const editedPackageFileMock = packageFileBuilder
        .with({ packages: [notValidPackageMock, notValidPackageMock2, notValidPackageMock3] })
        .build();

      const result = packageFileValidator.validate(editedPackageFileMock);
      expect(result).toHaveLength(3);
    });

    ObjectInvalidSchemaGenerator.for(packageFileBuilder.build())
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const result = packageFileValidator.validate(testCase.data);

          expect(result).toHaveLength(1);
        });
      });

    ObjectInvalidSchemaGenerator.for(packageBuilder.build())
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const editedPackageFileMock = packageFileBuilder.with({ packages: [testCase.data] }).build();
          const result = packageFileValidator.validate(editedPackageFileMock);

          expect(result).toHaveLength(1);
        });
      });
  });
});
