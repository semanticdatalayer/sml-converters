export interface SnowviewTable extends SnowviewSynonymAndComment {
  name: string;
  database: string;
  schema: string;
  table: string;
  primary_key: string[];
  unique_key?: string[];
}

export interface SnowviewRelationship {
  name: string;
  parent_entity: string;
  table: string;
  ref_table: string;
  foreign_key: string[];
  ref_key: string[];
}

export interface SnowviewFact extends SnowviewEntity {}

export interface SnowviewDimension extends SnowviewEntity {}

export interface SnowviewMetric extends SnowviewEntity {}

export interface SnowviewEntity extends SnowviewSynonymAndComment {
  name: string;
  parent_entity: string;
  table: string;
  expression: string;
  data_type: string;
  access_modifier: string;
}

export interface SnowviewSynonymAndComment {
  synonyms?: string[];
  comment?: string;
}

export interface SnowviewModel {
  tables: SnowviewTable[];
  relationships: SnowviewRelationship[];
  facts: SnowviewFact[];
  dimensions: SnowviewDimension[];
  metrics: SnowviewMetric[];
  comment?: string;
}

export const propertyMap = new Map<string, string>([
  ["BASE_TABLE_DATABASE_NAME", "database"],
  ["BASE_TABLE_SCHEMA_NAME", "schema"],
  ["BASE_TABLE_NAME", "table"],
  ["PRIMARY_KEY", "primary_key"],
  ["TABLE", "table"],
  ["REF_TABLE", "ref_table"],
  ["FOREIGN_KEY", "foreign_key"],
  ["REF_KEY", "ref_key"],
  ["EXPRESSION", "expression"],
  ["DATA_TYPE", "data_type"],
  ["ACCESS_MODIFIER", "access_modifier"],
  ["SYNONYMS", "synonyms"],
  ["COMMENT", "comment"],
  ["UNIQUE_KEY", "unique_key"],
]);

export interface SemanticViewDescribe {
  object_kind: string | null;
  object_name: string | null;
  parent_entity: string | null;
  property: string;
  property_value: string;
}

export interface TableDescribe {
  columns: ColumnDescribe[];
}

export interface ColumnDescribe {
  name: string;
  type: string;
  kind: string;
}

export interface TableLists {
  factTables: Set<SnowviewTable>;
  dimTables: Set<SnowviewTable>;
}
