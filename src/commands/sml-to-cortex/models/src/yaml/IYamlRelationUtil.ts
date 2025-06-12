import YamlDimensionTypeGuard from "./guards/YamlDimensionTypeGuard";

import {
  SMLDimensionRelationship,
  SMLEmbeddedRelationship,
  SMLSecurityRelationship,
  SMLDimensionRelationType,
  SMLModelRelationship,
  SMLModelSecurityRelationship
}from "sml-sdk"

// import {
//   IYamlDimensionRelationship,
//   IYamlEmbeddedRelationship,
//   IYamlSecurityRelationship,
//   YamlDimensionRelationType,
// } from "./IYamlDimension";
// import { IYamlModelRelationship, IYamlModelSecurityRelationship } from "./IYamlModel";

const emptyFrom = {
  dataset: "",
  join_columns: [],
};
const emptyTo = {
  dimension: "",
  level: "",
};

const emptyRelation: SMLModelRelationship = {
  from: { ...emptyFrom },
  to: { ...emptyTo },
  unique_name: "",
};

const getEmptyRelation = (): SMLModelRelationship => {
  return { ...emptyRelation, to: { ...emptyRelation.to }, from: { ...emptyRelation.from } };
};
const compareArrays = (a: string[], b: string[]) =>
  a.length === b.length && a.every((element, index) => element === b[index]);

export const buildEmptyRelationWithDataset = (datasetUniqueName: string): SMLModelRelationship => {
  const result = Object.assign(getEmptyRelation(), {
    from: { ...emptyFrom, dataset: datasetUniqueName },
  });

  return result;
};

export const buildEmptyRelationWithRowSecurity = (rowSecurityUniqueName: string): SMLModelSecurityRelationship => {
  const result: SMLModelSecurityRelationship = { ...emptyRelation, to: { row_security: rowSecurityUniqueName } };

  return result;
};

export const buildEmptyRelationWithDimension = (dimensionUniqueName: string): SMLModelRelationship => {
  const result = Object.assign(getEmptyRelation(), {
    to: { ...emptyTo, dimension: dimensionUniqueName },
  });

  return result;
};

export const buildEmptyEmbeddedRelationWithDimension = (dimensionUniqueName: string): SMLEmbeddedRelationship => {
  const result: SMLEmbeddedRelationship = {
    unique_name: "",
    to: { ...emptyTo, dimension: dimensionUniqueName },
    from: {
      dataset: "",
      join_columns: [],
      hierarchy: "",
      level: "",
    },
    type: SMLDimensionRelationType.Embedded,
  };

  return result;
};

export const buildEmptyRowSecurityDimensionRelation = (rowSecurityUniqueName: string): SMLSecurityRelationship => {
  const result: SMLSecurityRelationship = {
    from: {
      dataset: "",
      join_columns: [],
      hierarchy: "",
      level: "",
    },
    to: { row_security: rowSecurityUniqueName },
    type: SMLDimensionRelationType.Embedded,
    unique_name: "",
  };

  return result;
};

export const hasRelationEmptyTo = (relation: SMLModelRelationship | SMLDimensionRelationship): boolean => {
  // TODO: https://atscale.atlassian.net/browse/ATSCALE-18074
  if (YamlDimensionTypeGuard.isRegularRelation(relation)) {
    return (
      relation.type !== SMLDimensionRelationType.Snowflake &&
      relation.to.dimension === emptyTo.dimension &&
      relation.to.level == emptyTo.level
    );
  }

  if (YamlDimensionTypeGuard.isSecurityRelation(relation)) {
    return relation.to.row_security === "";
  }

  return false;
};

export const hasRelationEmptyFrom = (relation: SMLModelRelationship | SMLDimensionRelationship): boolean => {
  return (
    relation.from.dataset === emptyFrom.dataset && compareArrays(relation.from.join_columns, emptyFrom.join_columns)
  );
};
