import { deepFreeze } from "../deepFreeze";
import { IFile } from "../IFile";
import { IFolderStructure } from "../IFolderStructure";
import { IYamlFile } from "../IYamlFile";
import FileTypeGuard from "../type-guards/file-type-guard";
import rawJSon from "./ModelsTutorialsRaw.json";

const rootFolder = rawJSon as IFolderStructure<IFile>;

const extractYamlFiles = (currentFolder: IFolderStructure<IFile>, depth = 1): Array<IYamlFile> => {
  if (depth > 100) {
    throw new Error(`extractYamlFiles max depth exceeded. Current cal depth: ${depth}`);
  }

  //traverse files
  const yamlFiles = currentFolder.files.filter(FileTypeGuard.isYamlFile);

  //traverse subfolders
  const subFoldersYamlFiles = currentFolder.folders.flatMap((folder) => extractYamlFiles(folder, depth + 1));

  return [...yamlFiles, ...subFoldersYamlFiles];
};

const allFiles = extractYamlFiles(rootFolder);

const modelsTutorialsDef = {
  rootFolder,
  allFiles,
};

export const modelsTutorials: typeof modelsTutorialsDef = deepFreeze(modelsTutorialsDef);
