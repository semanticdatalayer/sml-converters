import { FunctionsAreAsync, ServiceBuilder } from "utils/service-builder/ServiceBuilder";

import type { ISubmodulesParser } from "./SubmodulesParser";

const asyncMetadata: FunctionsAreAsync<ISubmodulesParser> = {
  parseSubmodulesConfig: false,
  getSubmodules: true,
  getSubmoduleRepoPath: false,
};

export class SubmodulesParserBuilder extends ServiceBuilder<ISubmodulesParser> {
  static create() {
    const defaultImplementation: ISubmodulesParser = {
      parseSubmodulesConfig: jest.fn().mockReturnValue([]),
      getSubmodules: jest.fn().mockResolvedValue([]),
      getSubmoduleRepoPath: jest.fn().mockReturnValue(""),
    };
    return new SubmodulesParserBuilder(defaultImplementation, asyncMetadata).toBuilderWithServiceMethods();
  }
}
