import { IYamlModelMetricsAndCalc } from "models/src/yaml/IYamlModel";

export const yamlCompositeModelErrorMessages = {
  getDuplicateMetricUniqueNames: (metric: IYamlModelMetricsAndCalc, count: number): string =>
    `Metric ${metric.unique_name} is used ${count} times in composite model and its dependency models`,
  getDuplicateDimensionUniqueNames: (dimension: string, count: number): string =>
    `Dimension ${dimension} is used ${count} times in composite model's dependency models`,
  getDuplicateQueryNameOverrides: (queryName: string, count: number): string =>
    `Query name ${queryName} is used ${count} times in the overrides of composite model's dependency models`,
  commonRelationshipDimension: "Composite model's dependency models don't have a common dimension",
};
