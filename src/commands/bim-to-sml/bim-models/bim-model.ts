export enum BimColumnDataType {
  // TODO: Add more
  String = "string",
  DateTime = "dateTime",
  Int64 = "int64",
  Boolean = "boolean",
  Double = "double",
  Decimal = "decimal",
  Binary = "binary",
  Variant = "variant",
}

export enum BimPartitionMode {
  Import = "import",
}

export enum BimPartitionSourceType {
  M = "m",
  Calculated = "calculated",
  Entity = "entity",
}

export enum BimColumnType {
  Calculated = "calculated",
  CalculatedTableColumn = "calculatedTableColumn",
}

export interface BimRoot {
  name: string;
  compatibilityLevel: number;
  model: BimModel;
}

export interface BimModel {
  culture: string;
  dataAccessOptions: {
    legacyRedirects: boolean;
    returnErrorValuesAsNull: boolean;
    fastCombine: boolean;
  };
  defaultPowerBIDataSourceVersion: string;
  sourceQueryCulture: string;
  dataSources: Array<BimDataSource>;
  tables: Array<BimTable>;
  relationships: Array<BimRelationship>;
  perspectives: Array<BimPerspective>;
  cultures: Array<BimCulture>;
  annotations: Array<BimAnnotation>;
}

export interface BimDataSource {
  type?: "provider" | "structured"; // Optional, rarely used explicitly
  name: string;
  connectionDetails: BimConnectionDetails;
  options?: Record<string, unknown>; // Optional advanced config
  credential?: BimCredential; // Optional encrypted credential block (opaque)

  connectionString?: string;
  impersonationMode?: "impersonateServiceAccount" | "usernamePassword" | string;
  annotations?: Record<string, string>; // Optional metadata

  // protocol?: "tds" | "odbc" | "msmd" | "powerbi" | "powerbi-lakehouse" | string;
  // Only required if impersonationMode === 'usernamePassword'
  // username?: string;
  // password?: string;
  // description?: string;
  // kind?: string; // e.g. "SQL", "Snowflake", "PowerBI"
  // maxConnections?: number; // Optional tuning
}

export interface BimConnAddress {
  path?: string;
  server?: string;
  database?: string;
  schema?: string;
  AuthenticationKind?: string;
  kind?: string;
  PrivacySetting?: string;
}

export interface BimCredential {
  server: string;
  database: string;
}

export interface BimConnectionDetails {
  protocol?: string;
  address?: BimConnAddress;
  authentication?: string;
  query?: string;
}

export interface BimTable {
  name: string;
  description?: string | string[];
  isHidden: boolean;
  showAsVariationsOnly?: boolean;
  lineageTag: string;
  dataCategory?: string;
  refreshPolicy?: BimTableRefreshPolicy;
  columns: Array<BimTableColumn>;
  partitions: Array<BimTablePartition>;
  hierarchies: Array<BimTableHierarchy>;
  annotations: Array<BimAnnotation>;
  measures?: Array<BimMeasure>;
}

export interface BimMeasure {
  name: string;
  description?: string | string[];
  expression: string;
  formatString: string;
  isHidden: boolean;
  displayFolder: string;
  lineageTag: string;
  annotations: Array<BimAnnotation>;
}

export interface BimChangedProperty {
  property: string;
}

export interface BimTableHierarchyLevel {
  name: string;
  description: string | string[];
  ordinal: number;
  column: string;
  lineageTag: string;
}

export interface BimTableHierarchy {
  name: string;
  description?: string | string[];
  displayFolder?: string;
  isHidden: boolean;
  lineageTag: string;
  levels: Array<BimTableHierarchyLevel>;
  changedProperties: Array<BimChangedProperty>;
}

export interface BimTablePartition {
  name: string;
  mode: BimPartitionMode;
  source: {
    type: BimPartitionSourceType;
    expression?: string | Array<string>;
    query?: string | Array<string>;
    entityName?: string;
    expressionSource?: string;
    dataSource?: string;
    schemaName?: string;
  };
}
export interface BimTableRefreshPolicy {
  policyType?: string;
  sourceExpression?: string | Array<string>;
}

export interface BimTableColumn {
  type?: BimColumnType.Calculated;
  name: string;
  description?: string | string[];
  displayFolder: string;
  isHidden: boolean;
  dataType: BimColumnDataType;
  isKey?: boolean;
  sourceColumn?: string;
  formatString?: string;
  lineageTag: string;
  summarizeBy?: string;
  changedProperties: Array<BimChangedProperty>;
  annotations: Array<BimAnnotation>;
  expression?: string;
}

export interface BimRelationship {
  name: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface BimPerspective {
  name: string;
  description?: string | string[];
  tables: Array<BimTable>;
}

export interface BimCulture {
  name: string;
  linguisticMetadata: {
    content: { Version: string; Language: string; DynamicImprovement: string };
    contentType: string;
  };
}

export interface BimAnnotation {
  name: string;
  value: string;
}
