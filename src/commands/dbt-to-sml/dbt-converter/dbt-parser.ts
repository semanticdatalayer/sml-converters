import fileSystem from "fs/promises";
import path from "path";
import { z, ZodType } from "zod";

import { DbtPackages } from "../dbt-models/dbt-packages.model";
import { DbtProject } from "../dbt-models/dbt-project.model";
import { DbtYamlFile } from "../dbt-models/dbt-yaml.model";
import {
  DbtSelectors,
  dbtSelectorsSchema,
} from "../dbt-models/schemas/dbt-selectors.schema";
import Guard from "../../../shared/guard";
import { Logger } from "../../../shared/logger";
import { DbtFileType, IDbtIndex } from "../model";
import { dbtProjectSchema } from "../dbt-models/schemas/dbt-project.schema";
import { dbtPackagesSchema } from "../dbt-models/schemas/dbt-packages.schema";
import { dbtPropertySchema } from "../dbt-models/schemas/dbt-yaml.schema";
import { load } from "js-yaml";

class DbtIndexBuilder {
  static create() {
    return new DbtIndexBuilder();
  }

  private data: Partial<IDbtIndex> = {};

  setPackages(input: DbtPackages): void {
    Guard.ensure(
      this.data.packages === undefined,
      "Cannot set DbtPackages two times",
    );
    this.data.packages = input;
  }

  setProject(input: DbtProject): void {
    Guard.ensure(
      this.data.project === undefined,
      "Cannot set DbtProject two times",
    );
    this.data.project = input;
  }

  setSelectors(input: DbtSelectors): void {
    Guard.ensure(
      this.data.selectors === undefined,
      "Cannot set DbtProject two times",
    );
    this.data.selectors = input;
  }

  addYamlFile(input: DbtYamlFile): void {
    if (!this.data.properties) {
      this.data.properties = {
        analyses: [],
        exposures: [],
        groups: [],
        macros: [],
        metrics: [],
        models: [],
        seeds: [],
        snapshots: [],
        sources: [],
        semantic_models: [],
        version: 2,
      };
    }
    this.mergeDbtProperties(this.data.properties, input);
  }

  getData(): IDbtIndex {
    return {
      packages: this.data.packages,
      project: Guard.ensure(this.data.project, "No project found"),
      selectors: this.data.selectors,
      properties: Guard.ensure(
        this.data.properties,
        "No dbt yaml files are found",
      ),
    };
  }

  private mergeDbtProperties(target: DbtYamlFile, source: DbtYamlFile): void {
    Object.keys(target).forEach((propName) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sourceValue = source[propName as keyof DbtYamlFile] as Array<any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const targetValue = target[propName as keyof DbtYamlFile] as Array<any>;

      if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
        targetValue.push(...sourceValue);
      }
    });
  }
}

const getErrorMessage = (e: unknown): string => {
  if (!e) {
    return "unknown error";
  }
  if (e instanceof Error) {
    return e.message;
  }
  if (typeof e === "string") {
    return e;
  }
  return `${e}`;
};

const MAX_RECURSION_DEPTH = 50;

const dbtFiles = Object.freeze({
  project: "dbt_project.yml",
  selectors: "selectors.yml",
  packages: "packages.yml",
});

const yamlExtensions = Object.freeze([".yml", ".yaml"]);

export class DbtParser {
  static create(logger: Logger) {
    return new DbtParser(logger);
  }

  constructor(protected readonly logger: Logger) {}

  public async parseFolder(rootFolder: string): Promise<IDbtIndex> {
    const dbtIndexBuilder = DbtIndexBuilder.create();

    const { project, packages, selectors, subFolders } =
      await this.parseRootFolder(rootFolder);

    dbtIndexBuilder.setProject(project);
    if (packages) {
      dbtIndexBuilder.setPackages(packages);
    }
    if (selectors) {
      dbtIndexBuilder.setSelectors(selectors);
    }

    const definedModelsPaths = project["model-paths"] ?? ["models"];
    definedModelsPaths.forEach((modelPath) => {
      Guard.should(
        modelPath.indexOf("/") < 0,
        `Nested models paths are nt yet supported. Path: "${modelPath}"`,
      );
      const existingPath = subFolders.find(
        (subFolder) => subFolder === modelPath,
      );
      Guard.should(
        existingPath !== undefined,
        `Model path ${modelPath} does nto exists"`,
      );
    });

    await Promise.all(
      definedModelsPaths.map((modelPath) => {
        const absolutePath = path.join(rootFolder, modelPath);
        return this.parseFolderRecursive(absolutePath, dbtIndexBuilder);
      }),
    );

    return dbtIndexBuilder.getData();
  }

  private async parseRootFolder(rootFolder: string): Promise<{
    project: DbtProject;
    packages?: DbtPackages;
    selectors?: DbtSelectors;
    subFolders: Array<string>;
  }> {
    const { files, folders } = await this.getFilesAndFolders(rootFolder);

    const projectFile = Guard.ensure(
      files.find((f) => f === dbtFiles.project),
      `Cannot find project file in root with file name: ${dbtFiles.project}`,
    );

    const project = await this.parseDbtFile<DbtProject>(
      path.join(rootFolder, projectFile),
      DbtFileType.project,
    );

    const packageFileName = files.find((f) => f === dbtFiles.packages);
    let packages: DbtPackages | undefined;
    if (packageFileName) {
      packages = await this.parseDbtFile<DbtPackages>(
        path.join(rootFolder, packageFileName),
        DbtFileType.package,
      );
    }

    let selectors: DbtSelectors | undefined;
    const selectorsFileName = files.find((f) => f === dbtFiles.selectors);
    if (selectorsFileName) {
      selectors = await this.parseDbtFile<DbtSelectors>(
        path.join(rootFolder, selectorsFileName),
        DbtFileType.selectors,
      );
    }
    return {
      project,
      packages,
      selectors,
      subFolders: folders,
    };
  }

  private async getFilesAndFolders(
    folderPath: string,
  ): Promise<{ folders: Array<string>; files: Array<string> }> {
    const filesOrFolders = await fileSystem.readdir(folderPath);

    const result: {
      folders: Array<string>;
      files: Array<string>;
    } = {
      folders: [],
      files: [],
    };
    const statPromises = filesOrFolders
      .filter((x) => !x.startsWith("."))
      .map((x) => {
        const filePath = path.join(folderPath, x);
        return fileSystem.stat(filePath).then((statResult) => {
          return {
            name: x,
            statResult,
          };
        });
      });

    const stats = await Promise.all(statPromises);
    stats.forEach((fileOrFolder) => {
      if (fileOrFolder.statResult.isDirectory()) {
        result.folders.push(fileOrFolder.name);
      } else if (fileOrFolder.statResult.isFile()) {
        result.files.push(fileOrFolder.name);
      }
    });

    return result;
  }

  private async parseFolderRecursive(
    currentFolder: string,
    dbtIndexBuilder: DbtIndexBuilder,
    depth = 0,
  ) {
    if (depth > MAX_RECURSION_DEPTH) {
      throw Error(
        `Max recursion depth exceeded. current depth: ${depth}. current folder ${currentFolder}`,
      );
    }

    const { files, folders } = await this.getFilesAndFolders(currentFolder);
    await Promise.all(
      files.map((file) => {
        const fulPath = path.join(currentFolder, file);
        this.logger.info(`Parsing ${fulPath}`);
        return this.parseFile(fulPath, dbtIndexBuilder);
      }),
    );
    await Promise.all(
      folders.map((folder) =>
        this.parseFolderRecursive(
          path.join(currentFolder, folder),
          dbtIndexBuilder,
          depth + 1,
        ),
      ),
    );
  }

  private async parseFile(
    filePath: string,
    dbtIndexBuilder: DbtIndexBuilder,
  ): Promise<void> {
    try {
      if (!this.isYamlFile(filePath)) {
        return;
      }
      const parsedContent = await this.parseDbtFile<DbtYamlFile>(
        filePath,
        DbtFileType.property,
      );
      dbtIndexBuilder.addYamlFile(parsedContent);
    } catch (e) {
      const msg = getErrorMessage(e);
      throw new Error(`Error parsing file ${filePath}. ${msg}`);
    }
  }

  private async parseDbtFile<T>(
    filePath: string,
    type: DbtFileType,
  ): Promise<T> {
    const schemaParsersMap: Record<DbtFileType, ZodType> = {
      [DbtFileType.project]: dbtProjectSchema,
      [DbtFileType.package]: dbtPackagesSchema,
      [DbtFileType.selectors]: dbtSelectorsSchema,
      [DbtFileType.property]: dbtPropertySchema,
    };

    const schemaParsers = schemaParsersMap[type];

    try {
      const fileContent = await fileSystem.readFile(filePath, {
        encoding: "utf8",
      });
      const parsedObject = load(fileContent);
      this.logger.info(`Parsing ${type} path: ${filePath}`);
      const parsedResult = schemaParsers.parse(parsedObject);
      return parsedResult as T;
    } catch (err) {
      const msg = `Error parsing file "${filePath}"`;
      if (err instanceof z.ZodError) {
        const allErrors = err.issues.map(
          (i) => `Path: "${i.path}". Code: "${i.code}". "${i.message}"`,
        );

        throw new Error(
          `${msg}. Invalid file schema. Errors: ${allErrors.join(". ")}`,
        );
      } else {
        throw new Error(`${msg}. ${getErrorMessage(err)}`);
      }
    }
  }

  private isYamlFile(filePath: string): boolean {
    return yamlExtensions.includes(path.extname(filePath));
  }
}
