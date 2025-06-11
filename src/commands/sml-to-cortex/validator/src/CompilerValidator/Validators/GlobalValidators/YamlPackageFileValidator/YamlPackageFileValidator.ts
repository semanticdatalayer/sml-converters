import { IFile } from "models/src/IFile";
import { ICompilationOutput, Severity } from "models/src/IFileCompilationOutput";
import { IFolderStructure } from "models/src/IFolderStructure";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import packageSchema from "models/src/schemas/package.schema.json";
import FileTypeGuard from "models/src/type-guards/file-type-guard";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { IYamlPackage, IYamlPackageFile, PACKAGE_FILE_NAME } from "models/src/yaml/IYamlPackageFile";
import pathUtil from "utils/path.util";

import YamlFileParser from "../../../../FileParser/FileTypeParsers/YamlFileParser";
import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import { SchemaValidatorWrapper } from "../../../../YamlObjectSchemaValidator/SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlPackageSchemaValidator from "../../../../YamlObjectSchemaValidator/YamlPackageSchemaValidator/YamlPackageSchemaValidator";
import { ICompilerFolderValidator } from "../../../ICompilerValidator";
import YamlValidatorUtil from "../../YamlObjectReferenceValidators/YamlValidatorUtil";

export const yamlPackageFileValidatorErrors = {
  packagePropValueShouldBeUnique: (keyValue: string, key: keyof IYamlPackage): string => {
    return `package ${key} '${keyValue}' should be unique`;
  },
  packageNameShouldBeCorrect: (packageName: string): string => {
    return `packages[name=${packageName}] name should contains only a-z, A-Z, - or _ no spaces are allowed`;
  },
  packageUrlShouldBeCorrect: (packageUrl: string): string => {
    return `packages[name=${packageUrl}] url should be valid with protocol http or https`;
  },
  packageVersionShouldBeCorrect: (packageVersion: string): string => {
    return `packages[name=${packageVersion}] version should start with 'commit:', followed by 8 to 40 characters that can only be letters (a-f, A-F) or digits (0-9)`;
  },
};

const packageFileUniqueNames = [PACKAGE_FILE_NAME, PACKAGE_FILE_NAME.replace(".yml", ".yaml")];

export class YamlPackageFileValidator implements ICompilerFolderValidator {
  isFolderValidator = true;
  static create(): YamlPackageFileValidator {
    return new YamlPackageFileValidator();
  }

  validateFolderStructure(rootFolder: IFolderStructure<IFile>): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();

    rootFolder.files.forEach((file) => {
      const fileName = pathUtil.getFileNameFromPath(file.relativePath);
      if (packageFileUniqueNames.includes(fileName) && FileTypeGuard.isRawFile(file)) {
        const yamlParser = YamlFileParser.create();
        const result = yamlParser.parse(file);
        if (FileTypeGuard.isPackageFile(result.data)) {
          const compilationOutputs = this.validate(result.data);
          compilationOutputs.forEach((output) =>
            validatorOutput.addFileOutput(file.relativePath, output.severity, output.message)
          );
        }
      }
    });

    return validatorOutput;
  }

  validate(yamlPackageFile: Partial<IYamlPackageFile>): Array<ICompilationOutput> {
    const validationOutput: Array<ICompilationOutput> = [];

    const packageFileSchemaValidator = new YamlPackageSchemaValidator(
      new SchemaValidatorWrapper({ allErrors: true }),
      packageSchema
    );

    const item: IYamlParsedFile = {
      data: yamlPackageFile as IYamlObject,
      relativePath: "",
      rawContent: "",
      compilationOutput: [],
    };

    const result = packageFileSchemaValidator.validateAML(item);
    if (!result.isValid) {
      result.errors.forEach((err) => validationOutput.push({ severity: Severity.Error, message: err }));
    }

    const duplicatedPackagesByNameMap = YamlValidatorUtil.groupBy(yamlPackageFile.packages || [], (p) => [p.name]);
    this.appendErrors("name", duplicatedPackagesByNameMap, validationOutput);

    const duplicatedPackagesByUrlMap = YamlValidatorUtil.groupBy(yamlPackageFile.packages || [], (p) => [p.url]);
    this.appendErrors("url", duplicatedPackagesByUrlMap, validationOutput);

    return validationOutput;
  }

  private appendErrors(
    key: keyof IYamlPackage,
    packagesMap: Map<string, Array<IYamlPackage>>,
    validationOutput: Array<ICompilationOutput>
  ): void {
    Array.from(packagesMap.values())
      .filter((v) => v.length > 1)
      .forEach((packages) =>
        packages.forEach((p) =>
          validationOutput.push({
            severity: Severity.Error,
            message: yamlPackageFileValidatorErrors.packagePropValueShouldBeUnique(p[key], key),
          })
        )
      );
  }
}
