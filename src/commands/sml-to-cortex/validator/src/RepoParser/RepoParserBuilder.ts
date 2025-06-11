import { FunctionsAreAsync, ServiceBuilder } from "utils/service-builder/ServiceBuilder";

import { IRepoParser } from "./IRepoParser";

const asyncMetadata: FunctionsAreAsync<IRepoParser> = {
  extractYamlFiles: false,
  getYamlFilesWithValidObjectType: false,
  parseFile: false,
  parseFolderStructure: false,
};

export class RepoParserBuilder extends ServiceBuilder<IRepoParser> {
  static create() {
    const defaultImplementation: IRepoParser = {
      extractYamlFiles: jest.fn(),
      getYamlFilesWithValidObjectType: jest.fn(),
      parseFile: jest.fn(),
      parseFolderStructure: jest.fn(),
    };

    return new RepoParserBuilder(defaultImplementation, asyncMetadata).toBuilderWithServiceMethods();
  }
}
