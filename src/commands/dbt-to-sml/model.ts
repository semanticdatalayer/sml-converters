import { DWType } from "../../shared/dw-types";
import { SmlConverterResult } from "../../shared/sml-convert-result";
import { DbtPackages } from "./dbt-models/dbt-packages.model";
import { DbtProject } from "./dbt-models/dbt-project.model";
import { DbtYamlFile } from "./dbt-models/dbt-yaml.model";
import { DbtSelectors } from "./dbt-models/schemas/dbt-selectors.schema";

export class ConversionError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export interface IDbtConverterInput {
  atscaleConnectionId: string;
  database: string;
  schema: string;
  dbType: DWType;
}

export interface DbtConverterResult {
  smlObjects: SmlConverterResult;
}

export enum DbtFileType {
  project = "project",
  package = "package",
  selectors = "selectors",
  property = "property",
}

export interface IDbtIndex {
  packages?: DbtPackages;
  project: DbtProject;
  properties: Required<DbtYamlFile>;
  selectors?: DbtSelectors;
}
