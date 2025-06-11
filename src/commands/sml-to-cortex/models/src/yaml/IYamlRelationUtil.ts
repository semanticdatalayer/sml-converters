import YamlDimensionTypeGuard from "./guards/YamlDimensionTypeGuard";
import {
  IYamlDimensionRelationship,
  IYamlEmbeddedRelationship,
  IYamlSecurityRelationship,
  YamlDimensionRelationType,
} from "./IYamlDimension";
import { IYamlModelRelationship, IYamlModelSecurityRelationship } from "./IYamlModel";

const emptyFrom = {
  dataset: "",
  join_columns: [],
};
const emptyTo = {
  dimension: "",
  level: "",
};

const emptyRelation: IYamlModelRelationship = {
  from: { ...emptyFrom },
  to: { ...emptyTo },
  unique_name: "",
};

const getEmptyRelation = (): IYamlModelRelationship => {
  return { ...emptyRelation, to: { ...emptyRelation.to }, from: { ...emptyRelation.from } };
};
const compareArrays = (a: string[], b: string[]) =>
  a.length === b.length && a.every((element, index) => element === b[index]);

export const buildEmptyRelationWithDataset = (datasetUniqueName: string): IYamlModelRelationship => {
  const result = Object.assign(getEmptyRelation(), {
    from: { ...emptyFrom, dataset: datasetUniqueName },
  });

  return result;
};

export const buildEmptyRelationWithRowSecurity = (rowSecurityUniqueName: string): IYamlModelSecurityRelationship => {
  const result: IYamlModelSecurityRelationship = { ...emptyRelation, to: { row_security: rowSecurityUniqueName } };

  return result;
};

export const buildEmptyRelationWithDimension = (dimensionUniqueName: string): IYamlModelRelationship => {
  const result = Object.assign(getEmptyRelation(), {
    to: { ...emptyTo, dimension: dimensionUniqueName },
  });

  return result;
};

export const buildEmptyEmbeddedRelationWithDimension = (dimensionUniqueName: string): IYamlEmbeddedRelationship => {
  const result: IYamlEmbeddedRelationship = {
    unique_name: "",
    to: { ...emptyTo, dimension: dimensionUniqueName },
    from: {
      dataset: "",
      join_columns: [],
      hierarchy: "",
      level: "",
    },
    type: YamlDimensionRelationType.Embedded,
  };

  return result;
};

export const buildEmptyRowSecurityDimensionRelation = (rowSecurityUniqueName: string): IYamlSecurityRelationship => {
  const result: IYamlSecurityRelationship = {
    from: {
      dataset: "",
      join_columns: [],
      hierarchy: "",
      level: "",
    },
    to: { row_security: rowSecurityUniqueName },
    type: YamlDimensionRelationType.Embedded,
    unique_name: "",
  };

  return result;
};

export const hasRelationEmptyTo = (relation: IYamlModelRelationship | IYamlDimensionRelationship): boolean => {
  // TODO: https://atscale.atlassian.net/browse/ATSCALE-18074
  if (YamlDimensionTypeGuard.isRegularRelation(relation)) {
    return (
      relation.type !== YamlDimensionRelationType.Snowflake &&
      relation.to.dimension === emptyTo.dimension &&
      relation.to.level == emptyTo.level
    );
  }

  if (YamlDimensionTypeGuard.isSecurityRelation(relation)) {
    return relation.to.row_security === "";
  }

  return false;
};

export const hasRelationEmptyFrom = (relation: IYamlModelRelationship | IYamlDimensionRelationship): boolean => {
  return (
    relation.from.dataset === emptyFrom.dataset && compareArrays(relation.from.join_columns, emptyFrom.join_columns)
  );
};
