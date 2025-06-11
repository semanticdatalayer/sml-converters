import { IYamlModelMetricsAndCalc } from "./IYamlModel";
import { IYamlObject } from "./IYamlObject";

export interface IYamlCompositeModel extends IYamlObject {
  description?: string;
  models: Array<string>;
  metrics?: Array<IYamlModelMetricsAndCalc>;
}
