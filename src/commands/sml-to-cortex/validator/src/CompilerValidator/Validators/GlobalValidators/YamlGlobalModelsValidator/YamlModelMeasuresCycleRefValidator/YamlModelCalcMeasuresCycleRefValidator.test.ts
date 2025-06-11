import YamlCalculatedMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlCalculatedMeasureBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import ValidatorOutput from "../../../../../ValidatorOutput/ValidatorOutput";
import {
  ModelQueryableMetric,
  ModelQueryableMetricType,
} from "../../../../../YamlModelQueryNameResolver/YamlModelQueryNameResolver";
import YamlValidatorTestUtil from "../../../YamlObjectReferenceValidators/YamlValidatorTestUtil";
import {
  yamlGlobalConnectionsValidatorErrors,
  YamlModelCalcMeasuresCycleRefValidator,
} from "./YamlModelCalcMeasuresCycleRefValidator";

const validator = YamlModelCalcMeasuresCycleRefValidator.create();

const modelBuilder = YamlModelBuilder.create().uniqueName("the model").with({ metrics: [] });
const calcYamlBuilder = YamlCalculatedMeasureBuilder.create();
const measureQueryableItem = AnyObjectBuilder.from<ModelQueryableMetric>({
  file: calcYamlBuilder.uniqueName("no measure").buildYamlFile(),
  fileChain: [],
  queryName: "no query name",
  uniqueName: "no uniqie name",
  fullQueryName: "no full query name",
  label: "no label",
  type: ModelQueryableMetricType.Metric,
});

type GetMeasureInput = {
  uniqueName: string;
  queryName?: string;
  fileName?: string;
  type?: ModelQueryableMetricType;
  referencedMeasuresQueryNames?: Array<string>;
};

const getMeasure = (input: GetMeasureInput): ModelQueryableMetric => {
  return measureQueryableItem
    .with({
      queryName: input.queryName ?? input.uniqueName,
      uniqueName: input.uniqueName,
      file: calcYamlBuilder
        .uniqueName(input.uniqueName)
        .with({
          expression: input.referencedMeasuresQueryNames
            ? YamlValidatorTestUtil.generateValidMdx(...input.referencedMeasuresQueryNames)
            : "1 + 2",
        })
        .buildYamlFile(input.fileName),
      type: input.type ?? ModelQueryableMetricType.Metric,
    })
    .build();
};

const getCalcMeasure = (input: Omit<GetMeasureInput, "type">): ModelQueryableMetric => {
  return getMeasure({ ...input, type: ModelQueryableMetricType.MetricCalc });
};

describe("YamlModelCalcMeasuresCycleRefValidator", () => {
  it("should add no error if there are no measures referenced in the model", () => {
    const modelFile = modelBuilder.buildYamlFile();

    const validatorOutput = ValidatorOutput.create();

    validator.validate([], modelFile, validatorOutput);

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("should add no error if there are no calculated measures referenced in the model", () => {
    const modelFile = modelBuilder.buildYamlFile();

    const validatorOutput = ValidatorOutput.create();
    const allMeasures = [
      getMeasure({ uniqueName: "m1", type: ModelQueryableMetricType.DimensionalMetric }),
      getMeasure({ uniqueName: "m2", type: ModelQueryableMetricType.Metric }),
    ];
    validator.validate(allMeasures, modelFile, validatorOutput);

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("should add warning if referenced measure in the model cannot be found in the resolved queryable items", () => {
    const measureUniqueName = "not existing measure";
    const modelFile = modelBuilder.addMetric(measureUniqueName).buildYamlFile();

    const validatorOutput = ValidatorOutput.create();
    validator.validate([], modelFile, validatorOutput);

    expect(validatorOutput.hasErrors).toBe(false);
    expect(
      validatorOutput.hasFileWarningMessage(
        yamlGlobalConnectionsValidatorErrors.getMeasureIsNotFoundByUniqueName(measureUniqueName)
      )
    ).toBe(true);
  });

  it("should add no error if no cycle dependencies detected", () => {
    const modelFile = modelBuilder.addMetric("calc1").buildYamlFile();

    const calc1 = getCalcMeasure({
      uniqueName: "calc1",
      referencedMeasuresQueryNames: ["calc2", "m1"],
    });

    const calc2 = getCalcMeasure({
      uniqueName: "calc2",
      referencedMeasuresQueryNames: ["m2"],
    });

    const allMeasures = [
      calc1,
      calc2,
      getMeasure({ uniqueName: "m1", type: ModelQueryableMetricType.DimensionalMetric }),
      getMeasure({ uniqueName: "m2", type: ModelQueryableMetricType.Metric }),
    ];
    const validatorOutput = ValidatorOutput.create();
    validator.validate(allMeasures, modelFile, validatorOutput);

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("should add error if cycle dependencies detected", () => {
    const modelFile = modelBuilder.addMetric("calc1").buildYamlFile();

    const calc1 = getCalcMeasure({
      uniqueName: "calc1",
      referencedMeasuresQueryNames: ["calc2", "calc3"],
    });

    const calc2 = getCalcMeasure({
      uniqueName: "calc2",
      referencedMeasuresQueryNames: ["calc3"],
    });

    const calc3 = getCalcMeasure({
      uniqueName: "calc3",
      referencedMeasuresQueryNames: ["calc1"],
    });

    const allMeasures = [calc1, calc2, calc3];
    const validatorOutput = ValidatorOutput.create();
    validator.validate(allMeasures, modelFile, validatorOutput);

    expect(validatorOutput.hasErrors).toBe(true);
    expect(
      validatorOutput.hasFileErrorMessage(
        yamlGlobalConnectionsValidatorErrors.getCalcMeasureCycleReferenceError([
          calc1.file,
          calc2.file,
          calc3.file,
          calc1.file,
        ])
      )
    );
  });

  it("should add error if cycle dependencies detected based only on overridden query names", () => {
    const modelFile = modelBuilder.addMetrics("calc1", "calc2", "calc3").buildYamlFile();

    const calc1 = getCalcMeasure({
      uniqueName: "calc1",
      queryName: "query_calc1",
      referencedMeasuresQueryNames: ["query_calc2", "query_calc3"],
    });

    const calc2 = getCalcMeasure({
      uniqueName: "calc2",
      queryName: "query_calc2",
      referencedMeasuresQueryNames: ["query_calc3"],
    });

    const calc3 = getCalcMeasure({
      uniqueName: "calc3",
      queryName: "query_calc3",
      referencedMeasuresQueryNames: ["query_calc1"],
    });

    const allMeasures = [calc1, calc2, calc3];
    const validatorOutput = ValidatorOutput.create();
    validator.validate(allMeasures, modelFile, validatorOutput);

    expect(validatorOutput.hasErrors).toBe(true);
    expect(
      validatorOutput.hasFileErrorMessage(
        yamlGlobalConnectionsValidatorErrors.getCalcMeasureCycleReferenceError([
          calc1.file,
          calc2.file,
          calc3.file,
          calc1.file,
        ])
      )
    );
    expect(validatorOutput.getFilesWithErrors()).toHaveLength(1);
    expect(validatorOutput.getFilesWithErrors()[0].compilationOutput).toHaveLength(1);
  });
});
