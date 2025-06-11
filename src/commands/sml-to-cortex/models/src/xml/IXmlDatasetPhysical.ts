export interface IXmlSql {
  dialect: string;
  expression: string;
}

interface IXmlQueries {
  sql: string;
  sqls?: Array<IXmlSql>;
  alternate?: string;
}

interface IXmlDatasetConnection {
  id: string;
  name?: string;
}

interface IXmlDatasetTable {
  schema: string;
  name: string;
  database?: string;
  alternate?: string;
}

interface IXmlApiType {
  datatype: string;
  key: IXmlApiType;
  value: IXmlApiType;
  supported: string;
}

export interface IXmlDatasetColumn {
  name: string;
  type: IXmlApiType | string;
  sql?: string;
  sqls?: Array<IXmlSql>;
}

export interface IXmlMapColumns {
  name: string;
  delimited: {
    fieldTerminator: string;
    keyTerminator: string;
  };
  key: string;
  value: string;
  columns: Array<IXmlDatasetColumn>;
}

export interface IXmlDatasetPhysical {
  connection: IXmlDatasetConnection;
  column: Array<IXmlDatasetColumn>;
  immutable: string;
  mapColumns?: Array<IXmlMapColumns>;
  virtualDataset?: string;
  table?: Array<IXmlDatasetTable>;
  queries?: Array<IXmlQueries>;
  udf?: string;
}
