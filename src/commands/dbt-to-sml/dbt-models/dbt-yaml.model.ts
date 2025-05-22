/**
 * This interface was referenced by `Grants`'s JSON-Schema definition
 * via the `patternProperty` ".*".
 */
export type StringOrArrayOfStrings = string | ArrayOfStrings;
export type ArrayOfStrings = string[];
export type Group = string;
export type MetricInputMeasure =
  | string
  | {
      alias?: string;
      filter?: string;
      name?: string;
    };
export type BooleanOrJinjaString = JinjaString | boolean;
export type JinjaString = string;
export type Constraints = {
  columns?: StringOrArrayOfStrings;
  expression?: string;
  name?: string;
  type: string;
  warn_unenforced?: BooleanOrJinjaString;
  warn_unsupported?: BooleanOrJinjaString;
  [k: string]: unknown;
}[];
/**
 * Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.
 */
export type PolicyTags = string[];
export type Tests = string | RelationshipsTest | AcceptedValuesTest | NotNullTest | UniqueTest;
/**
 * The foreign key column
 */
export type RelationshipsField = string;
/**
 * Configuration, specific to BigQuery adapter, used to setup authorized views.
 */
export type AuthorizedViews = {
  database: string;
  project: string;
}[];

export type DbtYamlDimensionType = "CATEGORICAL" | "TIME" | "categorical" | "time";

export type DbtYamlDimensionTimeGranularity =
  | "DAY"
  | "WEEK"
  | "MONTH"
  | "QUARTER"
  | "YEAR"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

export type DbtYamlDimensionRegular = {
  name: string;
  type: DbtYamlDimensionType;
  description?: string;
  expr?: {
    type: string | boolean;
  };
  is_partition?: boolean;
};

export type DbtYamlTimeDimension = DbtYamlDimensionRegular & {
  type_params: {
    time_granularity: DbtYamlDimensionTimeGranularity;
  };
  validity_params?: {
    is_end: boolean;
    is_start: boolean;
  };
};

export type DbtYamlDimension = DbtYamlDimensionRegular | DbtYamlTimeDimension;

export type FreshnessDefinition =
  | {
      error_after?: FreshnessRules;
      filter?: string;
      warn_after?: FreshnessRules;
    }
  | {
      [k: string]: unknown;
    };
export type NumberOrJinjaString = JinjaString | number;
/**
 * The name of another package installed in your project. If that package has a source with the same name as this one, its properties will be applied on top of the base properties of the overridden source. https://docs.getdbt.com/reference/resource-properties/overrides
 */
export type PackageToOverride = string;
/**
 * How you will identify the table in {{ source() }} calls. Unless `identifier` is also set, this will be the name of the table in the database.
 */
export type Name = string;
/**
 * The table name as stored in the database. Only needed if you want to give the source a different name than what exists in the database (otherwise `name` is used by default)
 */
export type Identifier = string;

export interface DbtYamlFile {
  version?: 2;
  analyses?: {
    name: string;
    columns?: {
      name: string;
      description?: string;
      data_type?: string;
    }[];
    config?: {
      tags?: StringOrArrayOfStrings;
    };
    description?: string;
    docs?: DocsConfig;
    group?: Group;
    [k: string]: unknown;
  }[];
  exposures?: {
    name: string;
    label?: string;
    type: "dashboard" | "notebook" | "analysis" | "ml" | "application";
    depends_on: string[];
    description?: string;
    maturity?: "high" | "medium" | "low";
    meta?: {
      [k: string]: unknown;
    };
    owner: {
      name?: string;
      email: string;
    };
    tags?: StringOrArrayOfStrings;
    url?: string;
    [k: string]: unknown;
  }[];
  groups?: {
    name: string;
    owner: {
      name?: string;
      email?: string;
      [k: string]: unknown;
    };
  }[];
  macros?: {
    name: string;
    arguments?: {
      name: string;
      type?: string;
      description?: string;
    }[];
    description?: string;
    docs?: DocsConfig;
  }[];
  metrics?: DbtYamlMetric[];
  // metrics?: {
  //   description?: string;
  //   filter?: string;
  //   group?: Group;
  //   label: string;
  //   name: string;
  //   type:
  //     | "SIMPLE"
  //     | "RATIO"
  //     | "CUMULATIVE"
  //     | "DERIVED"
  //     | "simple"
  //     | "ratio"
  //     | "cumulative"
  //     | "derived"
  //     | "conversion"
  //     | "CONVERSION";
  //   type_params: MetricTypeParams;
  // }[];
  models?: {
    name: string;
    access?: "private" | "protected" | "public";
    columns?: ColumnProperties[];
    config?: ModelConfigs;
    constraints?: Constraints;
    description?: string;
    docs?: DocsConfig;
    group?: Group;
    latest_version?: number;
    meta?: {
      [k: string]: unknown;
    };
    tests?: Tests[];
    versions?: {
      v: number;
      config?: ModelConfigs;
      columns?: (IncludeExclude | ColumnProperties)[];
      [k: string]: unknown;
    }[];
  }[];
  seeds?: {
    name: string;
    columns?: ColumnProperties[];
    config?: {
      column_types?: {
        [k: string]: unknown;
      };
      copy_grants?: BooleanOrJinjaString;
      database?: string;
      enabled?: BooleanOrJinjaString;
      grants?: Grants;
      quote_columns?: BooleanOrJinjaString;
      schema?: string;
      [k: string]: unknown;
    };
    description?: string;
    docs?: DocsConfig;
    group?: Group;
    tests?: Tests[];
  }[];
  semantic_models?: {
    defaults?: {
      agg_time_dimension?: string;
    };
    description?: string;
    dimensions?: DbtYamlDimension[];
    entities?: DbtYamlEntity[];
    measures?: DbtYamlMeasure[];
    model: string;
    name: string;
    primary_entity?: string;
  }[];
  snapshots?: {
    name: string;
    columns?: ColumnProperties[];
    config?: {
      alias?: string;
      check_cols?: StringOrArrayOfStrings;
      enabled?: BooleanOrJinjaString;
      grants?: Grants;
      persist_docs?: PersistDocsConfig;
      "post-hook"?: ArrayOfStrings;
      "pre-hook"?: ArrayOfStrings;
      quote_columns?: BooleanOrJinjaString;
      strategy?: string;
      tags?: StringOrArrayOfStrings;
      target_database?: string;
      target_schema?: string;
      unique_key?: StringOrArrayOfStrings;
      updated_at?: string;
      [k: string]: unknown;
    };
    description?: string;
    docs?: DocsConfig;
    group?: Group;
    meta?: {
      [k: string]: unknown;
    };
    tests?: Tests[];
  }[];
  sources?: {
    /**
     * How you will identify the schema in {{ source() }} calls. Unless `schema` is also set, this will be the name of the schema in the database.
     */
    name: string;
    config?: {
      [k: string]: unknown;
    };
    database?: string;
    description?: string;
    freshness?: FreshnessDefinition;
    loaded_at_field?: string;
    loader?: string;
    meta?: {
      [k: string]: unknown;
    };
    overrides?: PackageToOverride;
    quoting?: {
      database?: BooleanOrJinjaString;
      identifier?: BooleanOrJinjaString;
      schema?: BooleanOrJinjaString;
    };
    /**
     * The schema name as stored in the database. Only needed if you want to use a different `name` than what exists in the database (otherwise `name` is used by default)
     */
    schema?: string;
    tables?: {
      name: Name;
      columns?: ColumnProperties[];
      description?: string;
      external?: {
        [k: string]: unknown;
      };
      freshness?: FreshnessDefinition;
      identifier?: Identifier;
      /**
       * Which column to check during data freshness tests. Only needed if the table has a different loaded_at_field to the one defined on the source overall.
       */
      loaded_at_field?: string;
      loader?: string;
      meta?: {
        [k: string]: unknown;
      };
      quoting?: {
        database?: BooleanOrJinjaString;
        identifier?: BooleanOrJinjaString;
        schema?: BooleanOrJinjaString;
      };
      tags?: StringOrArrayOfStrings;
      tests?: Tests[];
    }[];
    tags?: StringOrArrayOfStrings;
    tests?: Tests[];
    [k: string]: unknown;
  }[];
}
/**
 * Configurations for the appearance of nodes in the dbt documentation.
 */
export interface DocsConfig {
  /**
   * The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.
   */
  node_color?: string;
  show?: boolean;
}
export interface MetricTypeParams {
  denominator?: MetricInputMeasure;
  expr?: string | boolean;
  grain_to_date?: string;
  measure?: MetricInputMeasure;
  metrics?: MetricInputSchemaOrString[];
  numerator?: MetricInputMeasure;
  window?: string;
}

export type MetricInputSchemaOrString = MetricInputSchema | string;

export interface MetricInputSchema {
  alias?: string;
  filter?: string;
  name?: string;
  offset_to_grain?: string;
  offset_window?: string;
}
export interface ColumnProperties {
  name: string;
  constraints?: Constraints;
  data_type?: string;
  description?: string;
  meta?: {
    [k: string]: unknown;
  };
  policy_tags?: PolicyTags;
  quote?: BooleanOrJinjaString;
  tests?: Tests[];
  tags?: StringOrArrayOfStrings;
}
export interface RelationshipsTest {
  relationships?: {
    name?: string;
    config?: TestConfigs;
    field: RelationshipsField;
    to: string;
    where?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
/**
 * Configurations set here will override configs set in dbt_project.yml.
 */
export interface TestConfigs {
  /**
   * Only relevant when `store_failures` is true
   */
  alias?: string;
  /**
   * Only relevant when `store_failures` is true
   */
  database?: string;
  enabled?: BooleanOrJinjaString;
  error_if?: string;
  fail_calc?: string;
  limit?: number;
  /**
   * Only relevant when `store_failures` is true
   */
  schema?: string;
  severity?: JinjaString | ("warn" | "error");
  store_failures?: BooleanOrJinjaString;
  tags?: StringOrArrayOfStrings;
  warn_if?: string;
  [k: string]: unknown;
}
export interface AcceptedValuesTest {
  accepted_values?: {
    name?: string;
    config?: TestConfigs;
    quote?: boolean;
    values: string[];
    where?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
export interface NotNullTest {
  not_null?: {
    name?: string;
    config?: TestConfigs;
    where?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
export interface UniqueTest {
  unique?: {
    name?: string;
    config?: TestConfigs;
    where?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
export interface ModelConfigs {
  auto_refresh?: BooleanOrJinjaString;
  backup?: BooleanOrJinjaString;
  contract?: {
    enforced?: BooleanOrJinjaString;
    [k: string]: unknown;
  };
  file_format?: string;
  grant_access_to?: AuthorizedViews;
  grants?: Grants;
  /**
   * Configuration specific to BigQuery adapter used to set an expiration delay (in hours) to a table.
   */
  hours_to_expiration?: number;
  /**
   * Configuration of the KMS key name, specific to BigQuery adapter.
   */
  kms_key_name?: string;
  labels?: LabelConfigs;
  location?: string;
  materialized?: string;
  on_configuration_change?: "apply" | "continue" | "fail";
  on_schema_change?: "append_new_columns" | "fail" | "ignore" | "sync_all_columns";
  sql_header?: string;
  snowflake_warehouse?: string;
  target_lag?: string;
  [k: string]: unknown;
}
/**
 * grant config. each key is a database permission and the value is the grantee of that permission
 */
export interface Grants {
  [k: string]: StringOrArrayOfStrings;
}
/**
 * Configuration specific to BigQuery adapter used to add labels and tags to tables/views created by dbt.
 */
export interface LabelConfigs {
  /**
   * This interface was referenced by `LabelConfigs`'s JSON-Schema definition
   * via the `patternProperty` "^[a-z][a-z0-9_-]{0,62}$".
   */
  [k: string]: string;
}
export interface IncludeExclude {
  include?: StringOrArrayOfStrings;
  exclude?: StringOrArrayOfStrings;
  [k: string]: unknown;
}
export interface DbtYamlEntity {
  entity?: string;
  expr?: string | boolean;
  name: string;
  role?: string;
  type: "PRIMARY" | "UNIQUE" | "FOREIGN" | "NATURAL" | "primary" | "unique" | "foreign" | "natural";
}
export interface DbtYamlMeasure {
  agg:
    | "SUM"
    | "MIN"
    | "MAX"
    | "AVERAGE"
    | "COUNT_DISTINCT"
    | "SUM_BOOLEAN"
    | "COUNT"
    | "PERCENTILE"
    | "MEDIAN"
    | "sum"
    | "min"
    | "max"
    | "average"
    | "count_distinct"
    | "sum_boolean"
    | "count"
    | "percentile"
    | "median";
  agg_params?: AggregationTypeParams;
  agg_time_dimension?: string;
  create_metric?: boolean;
  create_metric_display_name?: string;
  description?: string;
  expr?: string | number | boolean;
  name: string;
  non_additive_dimension?: NonAdditiveDimension;
}
export interface DbtYamlMetric {
  description?: string;
  filter?: string;
  group?: Group;
  label: string;
  name: string;
  type:
    | "SIMPLE"
    | "RATIO"
    | "CUMULATIVE"
    | "DERIVED"
    | "simple"
    | "ratio"
    | "cumulative"
    | "derived"
    | "conversion"
    | "CONVERSION";
  type_params: MetricTypeParams;
}
export interface AggregationTypeParams {
  percentile?: number;
  use_approximate_percentile?: boolean;
  use_discrete_percentile?: boolean;
}
export interface NonAdditiveDimension {
  name: string;
  window_choice?: "MIN" | "MAX" | "min" | "max";
  window_groupings?: string[];
}
/**
 * Configurations for the persistence of the dbt documentation.
 */
export interface PersistDocsConfig {
  columns?: JinjaString | boolean;
  relation?: JinjaString | boolean;
}
export interface FreshnessRules {
  count: NumberOrJinjaString;
  period: "minute" | "hour" | "day";
}
