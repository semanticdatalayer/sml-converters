import { IYamlObject } from "./IYamlObject";

export enum YamlColumnDataType {
  Int = "int",
  Decimal = "decimal",
  Long = "long",
  Double = "double",
  Float = "float",
  String = "string",
  DateTime = "datetime",
  Date = "date",
  Boolean = "boolean",
  BigInt = "bigint",
  TinyInt = "tinyint",
  Number = "number",
  TimeStamp = "timestamp",
  Numeric = "numeric",
}

export enum YamlColumDataTypeWithPrecision {
  Numeric = "numeric",
  Number = "number",
  Decimal = "decimal",
}

export enum YamlFormatString {
  GeneralNumber = "general number",
  Standard = "standard",
  Scientific = "scientific",
  Fixed = "fixed",
  Percent = "percent",
  GeneralDate = "general date",
  LongDate = "long date",
  MediumDate = "medium date",
  ShortDate = "short date",
  LongTime = "long time",
  MediumTime = "medium time",
  ShortTime = "short time",
  YesNo = "yes/no",
  TrueFalse = "true/false",
  OnOff = "on/off",
}

export const INTEGRAL_FORMAT_STRINGS = [
  YamlFormatString.GeneralNumber,
  YamlFormatString.Standard,
  YamlFormatString.Scientific,
];
const FLOATING_FORMAT_STRINGS = INTEGRAL_FORMAT_STRINGS.concat([YamlFormatString.Fixed, YamlFormatString.Percent]);
const DATE_FORMAT_STRINGS = [
  YamlFormatString.GeneralDate,
  YamlFormatString.LongDate,
  YamlFormatString.MediumDate,
  YamlFormatString.ShortDate,
  YamlFormatString.LongTime,
  YamlFormatString.MediumTime,
  YamlFormatString.ShortTime,
];
const BOOLEAN_FORMAT_STRINGS = [YamlFormatString.YesNo, YamlFormatString.TrueFalse, YamlFormatString.OnOff];

export type FormatStringMap = Record<YamlColumnDataType, YamlFormatString[]>;
export const formatStringMap: FormatStringMap = {
  [YamlColumnDataType.Int]: INTEGRAL_FORMAT_STRINGS,
  [YamlColumnDataType.Long]: INTEGRAL_FORMAT_STRINGS,
  [YamlColumnDataType.Float]: FLOATING_FORMAT_STRINGS,
  [YamlColumnDataType.Double]: FLOATING_FORMAT_STRINGS,
  [YamlColumnDataType.Decimal]: FLOATING_FORMAT_STRINGS,
  [YamlColumnDataType.DateTime]: DATE_FORMAT_STRINGS,
  [YamlColumnDataType.Date]: DATE_FORMAT_STRINGS,
  [YamlColumnDataType.Boolean]: BOOLEAN_FORMAT_STRINGS,
  [YamlColumnDataType.String]: [],
  [YamlColumnDataType.BigInt]: INTEGRAL_FORMAT_STRINGS,
  [YamlColumnDataType.TinyInt]: INTEGRAL_FORMAT_STRINGS,
  [YamlColumnDataType.Number]: INTEGRAL_FORMAT_STRINGS,
  [YamlColumnDataType.TimeStamp]: DATE_FORMAT_STRINGS,
  [YamlColumnDataType.Numeric]: FLOATING_FORMAT_STRINGS,
};

export const formatStringMapValues = (formatStringMap: FormatStringMap): YamlFormatString[] =>
  Array.from(new Set(Object.values(formatStringMap).flat()));

export interface IYamlDatasetSqlDialects {
  dialect: string;
  sql: string;
}

export type IYamlDatasetColumn = IYamlDatasetColumnDerived | IYamlDatasetColumnSimple | IYamlDatasetColumnMap;

export interface IYamlDatasetColumnBase {
  name: string;
}

export interface IYamlDatasetColumnSimple extends IYamlDatasetColumnBase {
  data_type: string;
  sql?: string;
  dialects?: Array<IYamlDatasetSqlDialects>;
}

export interface IYamlDatasetColumnMapDefinition {
  field_terminator: string;
  key_terminator: string;
  key_type: string;
  value_type: string;
  is_prefixed?: boolean;
}

export interface IYamlDatasetColumnMap extends IYamlDatasetColumnBase {
  map: IYamlDatasetColumnMapDefinition;
}

export interface IYamlDatasetColumnDerived extends IYamlDatasetColumnBase {
  data_type: string;
  parent_column: string;
}

export interface IYamlDatasetProjectProps {
  allow_aggregates?: boolean;
  allow_local_aggs?: boolean;
  allow_peer_aggs?: boolean;
  allow_preferred_aggs?: boolean;
}

export interface IYamlDatasetModelProps extends IYamlDatasetProjectProps {
  create_hinted_aggregate?: boolean;
}

export interface IYamlDatasetAlternateProps {
  type: string;
}

export interface IYamlDatasetAlternateSql extends IYamlDatasetAlternateProps {
  sql: string;
}
export interface IYamlDatasetAlternateTable extends IYamlDatasetAlternateProps {
  connection_id: string;
  table: string;
}

export interface IYamlDataset extends IYamlObject {
  connection_id: string;
  columns: Array<IYamlDatasetColumn>;
  table?: string;
  sql?: string;
  dialects?: Array<IYamlDatasetSqlDialects>;
  immutable?: boolean;
  alternate?: IYamlDatasetAlternateSql | IYamlDatasetAlternateTable;
  description?: string;
  incremental?: IYamlDatasetIncremental;
}

export interface IYamlDatasetIncremental {
  column: string;
  grace_period: string;
}
