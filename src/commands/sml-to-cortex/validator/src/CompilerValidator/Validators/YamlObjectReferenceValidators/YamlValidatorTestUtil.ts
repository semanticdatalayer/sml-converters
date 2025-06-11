import { IYamlModelOverride } from "models/src/yaml/IYamlModel";

export default class YamlValidatorTestUtil {
  static createOverrides(overrides: Record<string, string>): IYamlModelOverride {
    return Object.keys(overrides).reduce((acc, c) => {
      acc[c] = { query_name: overrides[c] };
      return acc;
    }, {} as IYamlModelOverride);
  }

  static generateValidMdx(...metrics: string[]): string {
    return metrics.map((m) => `[Measures].[${m}]`).join(" + ");
  }
}
