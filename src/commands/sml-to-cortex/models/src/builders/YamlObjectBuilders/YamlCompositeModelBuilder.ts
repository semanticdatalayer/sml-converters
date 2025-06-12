import { 
  SMLObjectType,
  SMLCompositeModel
} from "sml-sdk";

import { ObjectType } from "../../ObjectType";
import { IYamlCompositeModel } from "../../yaml/IYamlCompositeModel";
import { IYamlModelMetricsAndCalc } from "../../yaml/IYamlModel";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class YamlCompositeModelBuilder extends YamlObjectBuilder<
  SMLCompositeModel,
  YamlCompositeModelBuilder
> {
  static create(): YamlCompositeModelBuilder {
    const defaultValues: SMLCompositeModel = {
      label: "no label",
      models: [],
      object_type: SMLObjectType.CompositeModel,
      unique_name: "no unique name",
    };

    return new YamlCompositeModelBuilder(defaultValues);
  }

  addModel(modelUniqueName: string): YamlCompositeModelBuilder {
    return this.with({ models: [...(this.clonedData.models || []), modelUniqueName] });
  }

  addModels(models: string[]): YamlCompositeModelBuilder {
    return this.with({ models: [...(this.clonedData.models || []), ...models] });
  }

  addMetric(meticUniqueName: string): YamlCompositeModelBuilder {
    return this.with({ metrics: [...(this.clonedData.metrics || []), { unique_name: meticUniqueName }] });
  }

  addMetricsCollection(...metrics: Array<IYamlModelMetricsAndCalc>): YamlCompositeModelBuilder {
    return this.with({ metrics: [...(this.clonedData.metrics || []), ...metrics] });
  }

  addMetrics(...metricUniqueNames: Array<string>): YamlCompositeModelBuilder {
    const addedMetrics: IYamlModelMetricsAndCalc[] = metricUniqueNames.map((m) => ({ unique_name: m }));
    return this.with({ metrics: [...(this.clonedData.metrics || []), ...addedMetrics] });
  }

  removeMetric(meticUniqueName: string): YamlCompositeModelBuilder {
    const metrics = this.clonedData.metrics || [];
    const newMetricsList = metrics.filter((metric) => metric.unique_name !== meticUniqueName);
    return this.with({ metrics: newMetricsList });
  }
}
