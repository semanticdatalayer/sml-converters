import path from "path";
import { FILE_TYPE, FileType, supportedEnvExtension, supportedTextFileExtensions } from "models/src/FileType";
import ICompilerSettings from "models/src/ICompilerSettings";
import { IFile } from "models/src/IFile";
import { IFolderStructure } from "models/src/IFolderStructure";
import { ILogger } from "models/src/ILogger";
import { OriginType, PACKAGE_ROOT_NAME } from "models/src/SourceType";
import { IYamlPackage } from "models/src/yaml/IYamlPackageFile";
import pathUtil from "utils/path.util";

import { IFileParser } from "../FileParser/IFileParser";
import { IFileService } from "../FileService/IFileService";
import { IFileTypeValidatorFactory } from "../FileTypeValidator/model";
import { IPackageParser, PackageParser } from "../PackagesParser/PackagesParser";
import { IRepoParser } from "../RepoParser/IRepoParser";
import { RepoParser } from "../RepoParser/RepoParser";
import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";
import { IYamlObjectTypeExtractor } from "../YamlObjectTypeExtractor/IYamlObjectTypeExtractor";
import { IRepoReader } from "./IRepoReader";

export interface RepoReaderDependencies {
  fileService: IFileService;
  logger: ILogger;
  fileParser?: IFileParser;
  fileTypeValidationFactory?: IFileTypeValidatorFactory;
  compilerSettings?: ICompilerSettings;
  yamlObjectTypeExtractor?: IYamlObjectTypeExtractor;
  repoParser?: IRepoParser;
  packageParser?: IPackageParser;
}

export const PACKAGES_ROOT_FOLDER_NAME = "packages";

export class RepoReader implements IRepoReader {
  private readonly fileService: IFileService;
  private readonly logger: ILogger;
  private readonly compilerSettings: ICompilerSettings;
  private readonly repoParser: IRepoParser;
  private readonly packageParser: IPackageParser;

  constructor(dependencies: RepoReaderDependencies) {
    this.fileService = dependencies.fileService;
    this.logger = dependencies.logger;
    this.compilerSettings = dependencies.compilerSettings || { amlFileExtensions: ["yaml", "yml"] };
    this.repoParser = dependencies.repoParser || new RepoParser();
    this.packageParser = dependencies.packageParser || new PackageParser(this.fileService, this.logger);
  }

  async parseFolder(rootFolder: string, validatorOutput = ValidatorOutput.create()): Promise<IFolderStructure<IFile>> {
    const resultRaw = await this.parseFolderRec(rootFolder, "", validatorOutput, OriginType.Root, PACKAGE_ROOT_NAME);

    const packages = await this.packageParser.getPackages(rootFolder);
    if (packages.length > 0) {
      await this.parsePackageFolders(resultRaw, validatorOutput, packages, rootFolder);
    }
    const result = this.repoParser.parseFolderStructure(resultRaw, validatorOutput);
    result.origin = OriginType.Root;

    return result;
  }

  private getPackagesRootFolder(): IFolderStructure<IFile> {
    const packagesRootFolder: IFolderStructure<IFile> = {
      files: [],
      folders: [],
      origin: OriginType.PackagesRoot,
      path: pathUtil.getFolderPath("", PACKAGES_ROOT_FOLDER_NAME),
      packageName: PACKAGE_ROOT_NAME,
    };

    return packagesRootFolder;
  }

  private async parsePackageFolders(
    repoRoot: IFolderStructure<IFile>,
    validatorOutput: ValidatorOutput,
    packages: Array<IYamlPackage>,
    rootFolder: string
  ): Promise<void> {
    const packagesRootFolder = this.getPackagesRootFolder();

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      const packageRootFolderPath = `${PACKAGES_ROOT_FOLDER_NAME}/${pkg.name}/`;

      const currentPackageRootFolder: IFolderStructure<IFile> = {
        files: [],
        folders: [],
        origin: OriginType.Package,
        path: packageRootFolderPath,
        packageName: pkg.name,
      };

      const packageRepoFolder = this.packageParser.getPackageRepoPath(rootFolder, pkg.name);
      const isExist = await this.fileService.isFolderExist(packageRepoFolder);
      packagesRootFolder.folders.push(currentPackageRootFolder);

      if (isExist) {
        const packageContent = await this.parseFolderRec(
          this.packageParser.getPackageRepoPath(this.getRepoNameFromFolderPath(rootFolder), pkg.name),
          "",
          validatorOutput,
          OriginType.Package,
          pkg.name
        );

        this.addPackageFiles(currentPackageRootFolder, packageContent, packageRootFolderPath);
      }
    }
    if (packages.length > 0) {
      repoRoot.folders.push(packagesRootFolder);
    }
  }

  private getRepoNameFromFolderPath = (repoFolder: string) => {
    return repoFolder.replace(/^\/|\/$/g, "");
  };

  private addPackageFiles(
    currentFolder: IFolderStructure<IFile>,
    packageFolder: IFolderStructure<IFile>,
    rootFolderPath: string
  ): void {
    packageFolder.files.forEach((f) =>
      currentFolder.files.push({ ...f, relativePath: `${rootFolderPath}${f.relativePath}` })
    );

    packageFolder.folders.forEach((folder) => {
      currentFolder.folders.push({ ...folder, files: [], folders: [], path: `${rootFolderPath}${folder.path}` });
    });

    currentFolder.folders.forEach((folder, index) => {
      this.addPackageFiles(folder, packageFolder.folders[index], rootFolderPath);
    });
  }

  private async parseFolderRec(
    rootFolder: string,
    relativeFolder: string,
    validatorOutput: ValidatorOutput,
    sourceType: OriginType,
    packageName: string
  ): Promise<IFolderStructure<IFile>> {
    const currentFolderPath = pathUtil.getPath(rootFolder, relativeFolder);
    const folderNames = await this.fileService.getFolders(currentFolderPath);
    const fileNames = await this.fileService.getFiles(currentFolderPath);

    const foldersParsed = await Promise.all(
      folderNames.map((folderName) => {
        return this.parseFolderRec(
          rootFolder,
          `${relativeFolder}${folderName}/`,
          validatorOutput,
          sourceType,
          packageName
        );
      })
    );

    const filesParsed = await Promise.all(
      fileNames.map((fileName) => {
        const relativePath = path.join(relativeFolder, fileName);
        return this.parseFile(rootFolder, relativePath, validatorOutput, sourceType, packageName);
      })
    );

    return {
      files: filesParsed,
      folders: foldersParsed,
      path: relativeFolder,
      origin: sourceType,
      packageName,
    };
  }

  private async parseFile(
    rootFolder: string,
    relativePath: string,
    validatorOutput: ValidatorOutput,
    origin: OriginType,
    packageName: string
  ): Promise<IFile> {
    const fullpath = path.join(rootFolder, relativePath);
    const extension = pathUtil.getExtensionFromPath(relativePath);
    const isAtScaleFile = extension !== undefined && this.compilerSettings.amlFileExtensions.includes(extension);
    const isTextFile = extension !== undefined && supportedTextFileExtensions.includes(extension);
    const isEnvFile = extension !== undefined && extension === supportedEnvExtension;
    if (!isAtScaleFile && !isTextFile && !isEnvFile) {
      const result = {
        compilationOutput: [],
        relativePath,
        type: FILE_TYPE.Unknown,
        origin: origin,
        packageName,
      };
      validatorOutput.file(result).addInfo("File is not recognized as atscale file and will be skipped");

      return result;
    }

    let type: FileType;
    if (isTextFile) {
      type = FILE_TYPE.Text;
    } else if (isEnvFile) {
      type = FILE_TYPE.Environment;
    } else {
      type = FILE_TYPE.Unknown;
    }

    const content = await this.fileService.readFile(fullpath);
    return {
      compilationOutput: [],
      type,
      rawContent: content,
      relativePath,
      origin: origin,
      packageName,
    } satisfies IFile;
  }
}
