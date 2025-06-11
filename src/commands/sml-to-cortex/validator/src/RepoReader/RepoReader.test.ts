import { FILE_TYPE } from "models/src/FileType";
import { IFile } from "models/src/IFile";
import { IFolderStructure } from "models/src/IFolderStructure";
import { OriginType } from "models/src/SourceType";
import { FolderStructureBuilder } from "utils/builders/FolderStructureBuilder";

import FileServiceBuilder from "../builders/FileServiceBuilder"; // todo: move these to the right spot
import LoggerServiceBuilder from "../builders/LoggerServiceBuilder";
import { IFileService } from "../FileService/IFileService";
import { PackageParserBuilder } from "../PackagesParser/PackageParserBuilder";
import { IPackageParser } from "../PackagesParser/PackagesParser";
import { IRepoParser } from "../RepoParser/IRepoParser";
import { RepoParserBuilder } from "../RepoParser/RepoParserBuilder";
import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";
import { PACKAGES_ROOT_FOLDER_NAME, RepoReader } from "./RepoReader";

const fileServiceBuilder = FileServiceBuilder.create();
const loggerBuilder = LoggerServiceBuilder.create();
const packageParserBuilder = PackageParserBuilder.create();
const repoParserBuilder = RepoParserBuilder.create();
const folderStructureBuilder = FolderStructureBuilder.create("");

const setup = (input?: { packageParser?: IPackageParser; fileService?: IFileService; repoParser?: IRepoParser }) => {
  const defaultFileService = fileServiceBuilder.build();
  const defaultLogger = loggerBuilder.build();
  const defaultPackageParser = packageParserBuilder.build();
  const defaultRepoParser = repoParserBuilder.build();

  return new RepoReader({
    fileService: input?.fileService || defaultFileService,
    logger: defaultLogger,
    packageParser: input?.packageParser || defaultPackageParser,
    repoParser: input?.repoParser || defaultRepoParser,
  });
};

const file1Name = "file1.yml";
const file2Name = "file2.yml";
const file3Name = "file3.yml";
const file4Name = "file4.yml";
const folder1Name = "folder1";
const folder2Name = "folder2";
const packageFolderName = "shared_package";
const packageNestedFolderName = "shared_package_nested";
const flatFolderStructure = folderStructureBuilder
  .addRootFile(file1Name)
  .addRootFile(file2Name)
  .addFolder(folderStructureBuilder.folder(folder1Name + "/").create())
  .addFolder(folderStructureBuilder.folder(folder2Name + "/").create());

describe("RepoReader", () => {
  describe("parseFolder", () => {
    it("should create correct folder structure when we have a package without nested folders", async () => {
      const packageParser = packageParserBuilder.getPackages
        .resolve([{ name: packageFolderName, url: "package.url", branch: "main", version: "1" }])
        .build();
      const fileService = fileServiceBuilder.getFiles
        .multipleResolves([[file1Name, file2Name], [], [], [file3Name], [file3Name], [file3Name]])
        .getFolders.multipleResolves([[folder1Name, folder2Name], []])
        .isFolderExist.resolve(true)
        .build();
      const repoParser = RepoParserBuilder.create()
        .parseFolderStructure.result({} as IFolderStructure<IFile>)
        .build();

      const repoReader = setup({ packageParser, fileService, repoParser });

      await repoReader.parseFolder("rootFolder");

      const expectedResult = flatFolderStructure
        .addFolder(
          folderStructureBuilder
            .folder(`${PACKAGES_ROOT_FOLDER_NAME}/`, OriginType.PackagesRoot)
            .addNestedFolder(
              folderStructureBuilder
                .folder(`${PACKAGES_ROOT_FOLDER_NAME}/${packageFolderName}/`, OriginType.Package, packageFolderName)
                .addFile(
                  `${PACKAGES_ROOT_FOLDER_NAME}/${packageFolderName}/${file3Name}`,
                  FILE_TYPE.Unknown,
                  OriginType.Package,
                  packageFolderName
                )
                .create()
            )
            .create()
        )

        .build();
      expect(repoParser.parseFolderStructure).toHaveBeenCalledWith(expectedResult, expect.any(ValidatorOutput));
    });

    it("should create correct folder structure when we have a package with nested structure", async () => {
      const packageParser = packageParserBuilder.getPackages
        .resolve([{ name: packageFolderName, url: "package.url", branch: "main", version: "1" }])
        .getPackageRepoPath.result(packageFolderName)
        .build();
      const fileService = fileServiceBuilder.getFiles
        .multipleResolves([[file1Name, file2Name], [], [], [file3Name], [file4Name], []])
        .getFolders.multipleResolves([[folder1Name, folder2Name], [], [], [packageNestedFolderName], []])
        .isFolderExist.resolve(true)
        .build();
      const repoParser = RepoParserBuilder.create()
        .parseFolderStructure.result({} as IFolderStructure<IFile>)
        .build();

      const repoReader = setup({ packageParser, fileService, repoParser });

      await repoReader.parseFolder("rootFolder");
      const expectedResult = flatFolderStructure
        .addFolder(
          folderStructureBuilder
            .folder(`${PACKAGES_ROOT_FOLDER_NAME}/`, OriginType.PackagesRoot)
            .addNestedFolder(
              folderStructureBuilder
                .folder(`${PACKAGES_ROOT_FOLDER_NAME}/${packageFolderName}/`, OriginType.Package, packageFolderName)
                .addFile(
                  `${PACKAGES_ROOT_FOLDER_NAME}/${packageFolderName}/${file3Name}`,
                  FILE_TYPE.Unknown,
                  OriginType.Package,
                  packageFolderName
                )
                .addNestedFolder(
                  folderStructureBuilder
                    .folder(
                      `${PACKAGES_ROOT_FOLDER_NAME}/${packageFolderName}/${packageNestedFolderName}/`,
                      OriginType.Package,
                      packageFolderName
                    )
                    .addFile(
                      `${PACKAGES_ROOT_FOLDER_NAME}/${packageFolderName}/${packageNestedFolderName}/${file4Name}`,
                      FILE_TYPE.Unknown,
                      OriginType.Package,
                      packageFolderName
                    )
                    .create()
                )
                .create()
            )
            .create()
        )

        .build();

      expect(repoParser.parseFolderStructure).toHaveBeenCalledWith(expectedResult, expect.any(ValidatorOutput));
    });

    it("should create correct folder structure when package folder is empty", async () => {
      const packageParser = packageParserBuilder.getPackages
        .resolve([{ name: packageFolderName, url: "package.url", branch: "main", version: "1" }])
        .getPackageRepoPath.result(packageFolderName)
        .build();
      const fileService = fileServiceBuilder.isFolderExist.resolve(false).build();
      const repoParser = RepoParserBuilder.create()
        .parseFolderStructure.result({} as IFolderStructure<IFile>)
        .build();

      const repoReader = setup({ packageParser, fileService, repoParser });

      await repoReader.parseFolder("rootFolder");
      const expectedResult = folderStructureBuilder
        .addFolder(
          folderStructureBuilder
            .folder(`${PACKAGES_ROOT_FOLDER_NAME}/`, OriginType.PackagesRoot)
            .addNestedFolder(
              folderStructureBuilder
                .folder(`${PACKAGES_ROOT_FOLDER_NAME}/${packageFolderName}/`, OriginType.Package, packageFolderName)
                .create()
            )
            .create()
        )
        .build();

      expect(repoParser.parseFolderStructure).toHaveBeenCalledWith(expectedResult, expect.any(ValidatorOutput));
    });
  });
});
