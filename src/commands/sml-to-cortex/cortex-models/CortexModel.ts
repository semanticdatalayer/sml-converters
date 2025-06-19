export class CortexModel {
  constructor(nameIn: string) {
    this.name = nameIn;
  }
  name: string;
  description?: string;
  tables?: Array<CortexTable>;
}

export interface CortexTable {
  name: string;
  description?: string;
  baseTable: {
    database: string;
    schema: string;
    table: string;
  };
  dimensions?: Array<CortexDimension>;
  time_dimensions?: Array<CortexTimeDimension>;
  measures: Array<CortexMeasure>;
  filters?: Array<CortexFilter>;
}

export interface CortexDimension {
  name: string;
  synonyms: Array<string>;
  description?: string;
  expr: string;
  data_type: string;
  unique?: boolean;
  sample_values?: Array<string>;
}

export interface CortexTimeDimension {
  name: string;
  synonyms?: Array<string>;
  description?: string;
  expr: string;
  data_type: string;
  unique?: boolean;
}

export interface CortexMeasure {
  name: string;
  synonyms?: Array<string>;
  description?: string;
  expr: string;
  data_type: string;
  default_aggregation?: string;
  allowed_dimensions?: Array<string>;
}

export interface CortexFilter {
  name: string;
  synonyms?: Array<string>;
  description?: string;
  expr: string;
}
