import { BimTable, BimTableColumn } from "./bim-model";

// Interfaces used for passing information and lookups
export interface TableLists {
  leftTables: Set<string>;
  rightTables: Set<string>;
  measTables: Set<string>;
  unusedTables: Set<string>;
  factTables: Array<BimTable>;
  dimTables: Array<BimTable>;
}

// Used for generating/tracking unique names
export interface AttributeMaps {
  
  // key: aggFn + lowerNoSpace(tableName + "[" + col.name + "]") -> sumsalesfact[salescol]
  // value: { tableName, colName,  uniqueName }
  metricLookup: Map<string, MetricProps>;

  // key: lower case label, value: # times it's used
  metricLabels: Map<string, number>;

  // Have 2 kinds of entries
  //   key: lower case unique_name, value: [type, bimTableName]
  //   key: lower case verboseName (e.g. makeUniqueName(`calculation.${tableName}.`) + meas.name), value: [unique_name]
  attrNameMap: Map<string, string[]>;
}

export interface BimColumnDetail {
  table: BimTable;
  column: BimTableColumn | undefined;
  label: string | undefined;
}

export interface MessagesMap {
  customMsgs: Set<string>;
  complexMsgs: Set<string>;
  unknownMsgs: Set<string>;
  rawCalcs: Set<string>;
}

export interface Returnable {
  expr: string;
  i: number;
  doReturn: boolean;
}

export interface DimAttrsType {
  levels: string[];
  attrs: string[];
}

// For passing multiple data points
export type ExtractedMeasure = {
  measName: string;
  newExpr: string;
  tableName: string | undefined;
};

export type MetricProps = {
  table: string;
  colName: string;
  uniqueName: string;
};
