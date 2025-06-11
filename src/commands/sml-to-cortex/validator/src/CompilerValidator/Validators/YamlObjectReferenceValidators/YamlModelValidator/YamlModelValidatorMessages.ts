import { ObjectType } from "models/src/ObjectType";
import YamlModelTypeGuard from "models/src/yaml/guards/YamlModelTypeGuard";
import {
  IYamlModelAggregate,
  IYamlModelMetricsAndCalc,
  IYamlModelRelationship,
  IYamlQueryNameWithObjectType,
} from "models/src/yaml/IYamlModel";

export const yamlModelErrorMessages = {
  getDimensionDegenerateError: (isDegenerate: boolean, dimension: string): string =>
    `The dimension '${dimension}' should ${isDegenerate ? "be degenerative" : "not be degenerative"}.`,
  getCalcMeasureContainsANonExistingMeasure: (calcMeasureName: string, measureName: string): string =>
    `Calculated metric "${calcMeasureName}" expression contains a non-existing metric: ${measureName}.`,
  getDuplicateRelationshipsMessage: (relationship: IYamlModelRelationship, duplicateCount: number) => {
    if (YamlModelTypeGuard.isSecurityRelation(relationship)) {
      return `There are ${duplicateCount} relationships with the same definition. From dataset: ${
        relationship.from.dataset
      } with join columns: [${relationship.from.join_columns.join(",")}] to row_security: ${
        relationship.to.row_security
      }`;
    }

    return `There are ${duplicateCount} relationships with the same definition. From dataset: ${
      relationship.from.dataset
    } with join columns: [${relationship.from.join_columns.join(",")}] to dimension: ${
      relationship.to.dimension
    } and level: ${relationship.to.level}`;
  },
  getDuplicateRelationshipsUniqueNameMessage: (relationship: IYamlModelRelationship, duplicateCount: number) =>
    `There are ${duplicateCount} relationships with the same unique_name: ${relationship.unique_name}.`,
  getDuplicateMetricUniqueNames: (measure: IYamlModelMetricsAndCalc, duplicateCount: number): string =>
    `Metrics must NOT have duplicate items (${measure.unique_name} appears ${duplicateCount} times)`,
  getDuplicateAggregatesUniqueNames: (aggs: IYamlModelAggregate, duplicateCount: number): string =>
    `Aggregates must NOT have duplicate items (${aggs.unique_name} appears ${duplicateCount} times)`,
  overridesInfo: "query_name overrides detected in model",
  getOverrideNotReferencedInModel: (override: string) =>
    `Override "${override}" is not referenced in the metrics or dimensions`,
  getOverridesDuplicateOnQueryNames: (overrides: Array<IYamlQueryNameWithObjectType>): string =>
    `${overrides
      .map((o) => `${o.object_type} with unique_name "${o.unique_name}"`)
      .join(", ")} have the same query_name "${overrides[0]?.query_name}"`,
  getDatasetForPropertiesNotExist: (datasetName: string) => `Dataset for dataset_properties ${datasetName} not exist.`,
  getDatasetPropertiesIncorrectType: (datasetName: string) =>
    `Dataset properties reference ${datasetName} is not ${ObjectType.Dataset}`,
};

export const yamlModelWarningMessages = {
  getDrillTroughExistingWarning: `Warning: drillthroughs are not yet supported and will be skipped.`,
  getTargetConnectionWarning: (aggName: string, index: number) =>
    `target_connection is obsolete. Please remove it. Aggregate at index ${index}, agg name: ${aggName}`,
};
