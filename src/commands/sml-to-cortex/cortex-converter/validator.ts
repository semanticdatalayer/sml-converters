import { Logger } from "../../../shared/logger";

// import { ILogger } from "models/src/ILogger";
import { IYamlFile } from "../models/src/IYamlFile";
import { IFileService } from "../validator/src/FileService/IFileService";
import LocalFileService from "../validator/src/FileService/LocalFileService";
import { PackageParser } from "../validator/src/PackagesParser/PackagesParser";
import { RepoParser } from "../validator/src/RepoParser/RepoParser";
import { RepoReader } from "../validator/src/RepoReader/RepoReader";
import { IRepoValidatorResult } from "../validator/src/RepoValidator/IRepoValidator";
import RepoValidator from "../validator/src/RepoValidator/RepoValidator";
import ValidatorOutput from "../validator/src/ValidatorOutput/ValidatorOutput";

/**
 * Reads the repository files and validates them.
 * @param rootFolder - absolute path to the root folder of the repository. NOTE: any referenced remote packages should already
 * be present in a subfolder named 'packages'.
 */
export async function validateRepoFiles(
  rootFolder: string,
  logger: Logger,
  fileService?: IFileService
): Promise<IRepoValidatorResult> {
  const fService: IFileService = fileService || new LocalFileService();
  const packageParser = new PackageParser(fService, logger);
  const repoReader = new RepoReader({ fileService: fService, logger, packageParser });
  const foldersWithFiles = await repoReader.parseFolder(rootFolder);
  return new RepoValidator().validateRepo(foldersWithFiles, false);
}

/** From a file path of a valid SML repo, returns all of the objects as a list.
 * Replaces references to env variables with their actual value. */
export async function flatRepoFromPath(path: string, logger: Logger): Promise<Array<IYamlFile>> {
  const validatorOutput = new ValidatorOutput();
  const fileService = new LocalFileService();
  const packageParser = new PackageParser(fileService, logger);
  const repoReader = new RepoReader({ fileService, logger, packageParser });
  const repoParser = new RepoParser();
  let foldersWithFiles;
  let yamlParsedFiles = new Array<IYamlFile>();

  try {
    foldersWithFiles = await repoReader.parseFolder(path, validatorOutput);
  } catch (err) {
    logger.error(`Error parsing folder of files: ${err}`);
  }
  if (foldersWithFiles) {
    yamlParsedFiles = repoParser.extractYamlFiles(foldersWithFiles);
    yamlParsedFiles = repoParser.getYamlFilesWithValidObjectType(yamlParsedFiles, validatorOutput);
  }

  // if (yamlParsedFiles)
  return yamlParsedFiles;
}
