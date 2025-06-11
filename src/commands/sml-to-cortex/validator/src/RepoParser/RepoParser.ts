import Handlebars from "handlebars";
import EnvFileBuilder from "models/src/builders/TextObjectBuilders/EnvFileBuilder";
import { FILE_TYPE, FileType, supportedEnvExtension, supportedTextFileExtensions } from "models/src/FileType";
import ICompilerSettings from "models/src/ICompilerSettings";
import { EnvFileData, IFile } from "models/src/IFile";
import { IFolderStructure } from "models/src/IFolderStructure";
import { IParsedFile } from "models/src/IParsedFile";
import { IYamlFile } from "models/src/IYamlFile";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { OriginType } from "models/src/SourceType";
import FileTypeGuard from "models/src/type-guards/file-type-guard";
import ValidationError from "models/src/ValidationError";
import TypeGuardUtil from "models/src/yaml/guards/type-guard-util";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import errorUtil from "utils/error.util";
import pathUtil from "utils/path.util";

import FileParser from "../FileParser/FileParser";
import { IFileParser } from "../FileParser/IFileParser";
import FileTypeValidatorFactory from "../FileTypeValidator/FileTypeValidatorFactory";
import { IFileTypeValidatorFactory } from "../FileTypeValidator/model";
import FolderStructureUtil from "../utils/folder-structure.util";
import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";
import { IYamlObjectTypeExtractor } from "../YamlObjectTypeExtractor/IYamlObjectTypeExtractor";
import YamlObjectTypeExtractor from "../YamlObjectTypeExtractor/YamlObjectTypeExtractor";
import { ASTNode, MustacheStatement, ProgramNode } from "./IAstNode";
import { IRepoParser } from "./IRepoParser";

export interface RepoParserDependencies {
  fileParser?: IFileParser;
  fileTypeValidationFactory?: IFileTypeValidatorFactory;
  compilerSettings?: ICompilerSettings;
  yamlObjectTypeExtractor?: IYamlObjectTypeExtractor;
}

export type RawContentFile = IFile & { rawContent: string };

const hasRawContent = (file: IFile): file is RawContentFile => {
  return TypeGuardUtil.hasProps<RawContentFile>("rawContent") && ((file as RawContentFile).rawContent || "").length > 0;
};

const getUnknownFile = (file: IFile): IFile => {
  return {
    relativePath: file.relativePath,
    compilationOutput: [],
    origin: file.origin,
    type: "Unknown",
    data: file.data,
    rawContent: file.rawContent,
    packageName: file.packageName,
  };
};

export class RepoParser implements IRepoParser {
  private readonly fileParser: IFileParser;
  private readonly compilerSettings: ICompilerSettings;
  private readonly fileTypeValidationFactory: IFileTypeValidatorFactory;
  private readonly yamlObjectTypeExtractor: IYamlObjectTypeExtractor;

  constructor(dependencies: RepoParserDependencies = {}) {
    this.compilerSettings = dependencies.compilerSettings || { amlFileExtensions: ["yaml", "yml"] };
    this.fileTypeValidationFactory = dependencies.fileTypeValidationFactory || new FileTypeValidatorFactory();
    this.yamlObjectTypeExtractor = dependencies.yamlObjectTypeExtractor || new YamlObjectTypeExtractor();
    this.fileParser = dependencies.fileParser || new FileParser();
  }

  parseFolderStructure(folder: IFolderStructure<IFile>, validatorOutput: ValidatorOutput): IFolderStructure<IFile> {
    const envVariablesFile = folder.files.find((file) => file.relativePath === EnvFileBuilder.relativePath);
    const parsedEnvFile = envVariablesFile ? this.parseFile(envVariablesFile, validatorOutput) : undefined;
    const environmentVariables = parsedEnvFile?.data as EnvFileData | undefined;

    if (envVariablesFile) {
      folder.files = folder.files.filter((file) => file.relativePath !== EnvFileBuilder.relativePath) ?? [];
    }

    const parsedFiles = this.parseFolderStructureInternal(folder, validatorOutput, environmentVariables);

    if (parsedEnvFile) {
      parsedFiles.files.push(parsedEnvFile);
    }

    return parsedFiles;
  }

  private parseFolderStructureInternal(
    folder: IFolderStructure<IFile>,
    validatorOutput: ValidatorOutput,
    environmentVariables?: EnvFileData,
    depth = 1
  ): IFolderStructure<IFile> {
    if (depth >= 50) {
      const message = `Max folder depth exceed. Max folder depth is 50. Current folder path: ${folder.path}`;
      validatorOutput.global().addError(message);
      throw new ValidationError(message);
    }
    const result: IFolderStructure<IFile> = {
      path: folder.path,
      origin: folder.origin,
      files: [],
      folders: [],
      packageName: folder.packageName,
    };

    result.files = folder.files.map((f) => this.parseFile(f, validatorOutput, environmentVariables));

    result.folders = folder.folders.map((f) =>
      this.parseFolderStructureInternal(f, validatorOutput, environmentVariables, depth + 1)
    );

    return result;
  }

  private getTextFile(file: IFile): IFile {
    return {
      ...file,
      type: FILE_TYPE.Text,
      data: undefined,
    };
  }

  private getEnvFile(file: IFile, data?: EnvFileData): IFile {
    return {
      ...file,
      type: FILE_TYPE.Environment,
      data,
    };
  }

  parseFile(file: IFile, validatorOutput: ValidatorOutput, environmentVariables?: EnvFileData): IFile {
    const extensions = [
      ...this.compilerSettings.amlFileExtensions,
      supportedEnvExtension,
      ...supportedTextFileExtensions,
    ];
    if (!this.hasValidExtension(extensions, file)) {
      validatorOutput.file(file).addInfo("File is not recognized as atscale file and will be skipped");
      return getUnknownFile(file);
    }

    const isUnknownYmlFile = this.compilerSettings.amlFileExtensions.includes(
      pathUtil.getExtensionFromPath(file.relativePath) || ""
    );
    const isEnvFile = FileTypeGuard.isEnvFile(file);

    if (isEnvFile && !pathUtil.isFileOnRootLevel(file.relativePath)) {
      validatorOutput.file(file).addWarning(`Environment files should be on root level`);
    }

    if (hasRawContent(file)) {
      const fileTypeValidator = this.fileTypeValidationFactory.getValidator(file.relativePath);
      const errors = fileTypeValidator.getErrors(file.rawContent);
      if (errors.length > 0) {
        errors.forEach((e) => {
          validatorOutput.file(file).addError(e);
        });
        if (isEnvFile) {
          return this.getEnvFile(file);
        }
        if (isUnknownYmlFile) {
          return this.getTextFile(file);
        }
        return getUnknownFile(file);
      }
      let parsedFile: IParsedFile = {} as IParsedFile;
      const hasEnvironmentVariables = this.hasVariables(file.rawContent);

      try {
        const fileWithReplacedEnvVars = this.handleEnvironmentVariableInFile(file, environmentVariables);

        parsedFile = this.fileParser.parse(fileWithReplacedEnvVars);
      } catch (e) {
        validatorOutput
          .file(file)
          .addError(`File content is invalid. It cannot be parsed. ${errorUtil.getErrorMessage(e)}`);

        if (isEnvFile) {
          return this.getEnvFile(file);
        }
        if (isUnknownYmlFile) {
          return this.getTextFile(file);
        }
        return getUnknownFile(file);
      }

      const objectType = this.yamlObjectTypeExtractor.getType(parsedFile as IYamlParsedFile, validatorOutput);

      if (hasEnvironmentVariables && objectType !== ObjectType.Connection) {
        validatorOutput
          .file(file)
          .addError(
            "Variable placeholders (e.g., {{VARIABLE_NAME}}) were detected in a file that is not a connection file. Variable replacement is only supported for connection files. Please ensure that variables are only used within connection files, or update the file type accordingly."
          );
      }

      if (!objectType) {
        if (isEnvFile) {
          return this.getEnvFile(file, parsedFile.data as EnvFileData);
        }
        if (FileTypeGuard.isTextFile(file) || isUnknownYmlFile) {
          return this.getTextFile(file);
        }

        return getUnknownFile(file);
      } else {
        const yamlFile: IYamlFile = {
          ...file,
          type: objectType,
          data: parsedFile.data as IYamlObject,
        };

        return yamlFile;
      }
    } else {
      if (isEnvFile) {
        validatorOutput.file(file).addWarning("Environment file is empty");
        return this.getEnvFile(file);
      }
      if (FileTypeGuard.isTextFile(file)) {
        return this.getTextFile(file);
      }
      validatorOutput.file(file).addInfo("File has no rawContent and will be skipped");
      return getUnknownFile(file);
    }
  }

  extractYamlFiles(folderStructure: IFolderStructure<IFile>): Array<IYamlFile> {
    const parsedFiles: Array<IYamlFile> = [];

    FolderStructureUtil.traverse(folderStructure, (file) => {
      if (FileTypeGuard.isYamlFile(file)) {
        if (this.hasValidExtension(this.compilerSettings.amlFileExtensions, file)) {
          if (this.isFileTypeCatalog(file.type) && file.origin !== OriginType.Root) {
            return;
          }

          parsedFiles.push(file);
        }
      }
    });

    return parsedFiles;
  }

  hasValidExtension(extensions: Array<string>, parsedFile: { relativePath: string }): boolean {
    const extension = pathUtil.getExtensionFromPath(parsedFile.relativePath);
    return !!extension && extensions.includes(extension);
  }

  getYamlFilesWithValidObjectType(parsedFiles: Array<IFile>, validatorOutput: ValidatorOutput): Array<IYamlFile> {
    const yamlParsedFiles: Array<IYamlFile> = [];
    parsedFiles.forEach((yamlFile) => {
      if (FileTypeGuard.isYamlFile(yamlFile)) {
        const type = this.yamlObjectTypeExtractor.getType(yamlFile, validatorOutput);
        if (type) {
          yamlParsedFiles.push(yamlFile);
        }
      }
    });

    return yamlParsedFiles;
  }

  private isFileTypeCatalog(fileType: FileType): boolean {
    return fileType === FILE_TYPE.Catalog;
  }

  public handleEnvironmentVariableInFile(file: RawContentFile, environmentVariables?: EnvFileData): RawContentFile {
    const hasEnvironmentVariables = this.hasVariables(file.rawContent);

    if (!hasEnvironmentVariables) {
      return file;
    }

    if (!environmentVariables) {
      throw new Error(
        `Referenced variables were detected, but the .env file is absent. Please create the .env file with the necessary variables.`
      );
    }

    const updatedRawContent = this.replaceVariablesInRawContent(file.rawContent, environmentVariables);

    return { ...file, rawContent: updatedRawContent };
  }

  /**
   * Replaces {{variable_name}} placeholders with values from envVariables.
   * Throws an error if variables are used in "unique_name", "object_type", or are missing.
   */
  private replaceVariablesInRawContent(rawContent: string, envVariables?: EnvFileData): string {
    if (!envVariables) return rawContent;

    this.validateVariablesInTemplate(rawContent, envVariables);
    this.validateNoVariablesInForbiddenFields(rawContent);

    return this.replaceVariablesInString(rawContent, envVariables);
  }

  private replaceVariablesInString(original: string, envVariables: EnvFileData): string {
    const template = Handlebars.compile(original);
    return template(envVariables);
  }

  /** Validates that variables are not used in "unique_name" or "object_type" fields. If found, throws an error. */
  private validateNoVariablesInForbiddenFields(rawContent: string): void {
    const lines = rawContent.split("\n").map((line) => line.trim());

    for (const line of lines) {
      if (line.startsWith("unique_name:")) {
        const uniqueNameValue = this.extractFieldValue(line, "unique_name");
        if (this.hasVariables(uniqueNameValue)) {
          throw new Error('Variables cannot be used in the "unique_name" field. Please provide a fixed value.');
        }
      }

      if (line.startsWith("object_type:")) {
        const objectTypeValue = this.extractFieldValue(line, "object_type");
        if (this.hasVariables(objectTypeValue)) {
          throw new Error('Variables cannot be used in the "object_type" field. Please provide a fixed value.');
        }
      }
    }
  }

  /** Extracts the value of a field (e.g., "unique_name" or "object_type") from a line. */
  private extractFieldValue(line: string, fieldName: string): string {
    const [, value] = line.split(`${fieldName}:`).map((part) => part.trim());
    return value;
  }

  public validateVariablesInTemplate(template: string, variables: Record<string, unknown>): void {
    const parsedTemplate = Handlebars.parse(template) as ProgramNode;
    const usedVariables = this.collectVariablesFromAST(parsedTemplate);
    const undefinedVars = usedVariables.filter((varName) => !(varName in variables));
    if (undefinedVars.length) {
      throw new Error(
        `The variable {{${undefinedVars[0]}}} used in the connection file is not defined in the .env file. Please add ${undefinedVars[0]}="your_value_here" to the .env file to resolve this issue.`
      );
    }
  }

  private collectVariablesFromAST(astNode: ASTNode): string[] {
    if (astNode.type === "MustacheStatement") {
      const mustacheNode = astNode as MustacheStatement;
      return [mustacheNode.path.original];
    }

    if (astNode.type === "Program" && Array.isArray(astNode.body)) {
      const programNode = astNode as ProgramNode;
      return programNode.body.flatMap((node: ASTNode) => this.collectVariablesFromAST(node));
    }

    return [];
  }

  public hasVariables(template: string): boolean {
    const parsedTemplate = Handlebars.parse(template) as ProgramNode;
    return this.collectVariablesFromAST(parsedTemplate).length > 0;
  }
}
