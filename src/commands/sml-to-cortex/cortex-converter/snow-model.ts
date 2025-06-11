export class ISnowModel {
  constructor(nameIn: string) {
    this.name = nameIn;
  }
  name: string;
  description?: string;
  tables?: Array<ISnowTable>;
}

export interface ISnowTable {
  name: string;
  description?: string;
  baseTable: {
    database: string;
    schema: string;
    table: string;
  };
  dimensions?: Array<ISnowDimension>;
  time_dimensions?: Array<ISnowTimeDimension>;
  measures: Array<ISnowMeasure>;
  filters?: Array<ISnowFilter>;
}

export interface ISnowDimension {
  name: string;
  synonyms: Array<string>;
  description?: string;
  expr: string;
  data_type: string;
  unique?: boolean;
  sample_values?: Array<string>;
}

export interface ISnowTimeDimension {
  name: string;
  synonyms?: Array<string>;
  description?: string;
  expr: string;
  data_type: string;
  unique?: boolean;
}

export interface ISnowMeasure {
  name: string;
  synonyms?: Array<string>;
  description?: string;
  expr: string;
  data_type: string;
  default_aggregation?: string;
  allowed_dimensions?: Array<string>;
}

export interface ISnowFilter {
  name: string;
  synonyms?: Array<string>;
  description?: string;
  expr: string;
}
