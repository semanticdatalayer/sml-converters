import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlDimension, YamlDimensionRelationType } from "models/src/yaml/IYamlDimension";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import { DimensionCircularReferenceValidator } from "./DimensionCircularReferenceValidator";

const circularValidator = new DimensionCircularReferenceValidator();

const addDependency = (dimension: YamlDimensionBuilder, dependentDimensions: Array<string>): YamlDimensionBuilder => {
  return dependentDimensions.reduce((dim, dependantDim) => {
    return dim.addRelationship({
      from: {
        dataset: "some_ds",
        hierarchy: "some hierarchy",
        join_columns: [],
        level: "some level",
      },
      to: {
        dimension: dependantDim,
        level: "some level",
      },
      type: YamlDimensionRelationType.Embedded,
    });
  }, dimension);
};

const getDimensionFiles = (
  input: Array<{ dimension: string; dependencies: Array<string> }>
): Array<IYamlParsedFile<IYamlDimension>> => {
  const dimensionBuilders = new Map<string, YamlDimensionBuilder>();
  new Set(input.flatMap((x) => [x.dimension, ...x.dependencies])).forEach((value) => {
    dimensionBuilders.set(value, YamlDimensionBuilder.create().uniqueName(value));
  });

  input.forEach((x) => {
    const modifiedDimension = addDependency(dimensionBuilders.get(x.dimension)!, x.dependencies);
    dimensionBuilders.set(x.dimension, modifiedDimension);
  });

  return Array.from(dimensionBuilders.values()).map((builder) => builder.buildYamlFile());
};

describe("DimensionCircularReferenceValidator", () => {
  it("Should return nothing nothing if no dependencies are found", () => {
    const dimensions = getDimensionFiles([
      { dimension: "dim1", dependencies: ["dim2", "dim3"] },
      { dimension: "dim2", dependencies: ["dim3", "dim4"] },
      { dimension: "dim4", dependencies: ["dim5"] },
    ]);
    const validatorResult = ValidatorOutput.create();
    circularValidator.checkDependencyCycles(dimensions, validatorResult);

    expect(validatorResult.hasErrors).toBe(false);
    expect(validatorResult.hasWarnings).toBe(false);
  });

  it("Should return if a direct dependency cycle is detected", () => {
    const dimensions = getDimensionFiles([
      { dimension: "dim1", dependencies: ["dim2", "dim3"] },
      { dimension: "dim2", dependencies: ["dim3", "dim4"] },
      { dimension: "dim3", dependencies: ["dim2"] },
    ]);
    const validatorResult = ValidatorOutput.create();
    circularValidator.checkDependencyCycles(dimensions, validatorResult);

    expect(validatorResult.hasErrors).toBe(false);
    expect(validatorResult.hasWarnings).toBe(true);
    expect(
      validatorResult.hasFileWarningMessage(circularValidator.getDependencyCycleError(["dim2", "dim3", "dim2"]))
    ).toBe(true);
  });

  it("Should return if  implicit dependency cycle is detected", () => {
    const dimensions = getDimensionFiles([
      { dimension: "dim1", dependencies: ["dim2"] },
      { dimension: "dim2", dependencies: ["dim3"] },
      { dimension: "dim3", dependencies: ["dim4"] },
      { dimension: "dim4", dependencies: ["dim2"] },
    ]);
    const validatorResult = ValidatorOutput.create();
    circularValidator.checkDependencyCycles(dimensions, validatorResult);

    expect(validatorResult.hasErrors).toBe(false);
    expect(validatorResult.hasWarnings).toBe(true);
    expect(
      validatorResult.hasFileWarningMessage(circularValidator.getDependencyCycleError(["dim2", "dim3", "dim4", "dim2"]))
    ).toBe(true);
  });

  it("Should return all cycle dependencies", () => {
    const dimensions = getDimensionFiles([
      { dimension: "dimA", dependencies: ["dimB"] },
      { dimension: "dimB", dependencies: ["dimC"] },
      { dimension: "dimC", dependencies: ["dimE", "dimD"] },
      { dimension: "dimE", dependencies: ["dimB", "dimD"] },
      { dimension: "dimD", dependencies: ["dimG"] },
      { dimension: "dimG", dependencies: ["dimF"] },
      { dimension: "dimF", dependencies: ["dimD"] },
    ]);
    const validatorResult = ValidatorOutput.create();
    circularValidator.checkDependencyCycles(dimensions, validatorResult);

    expect(validatorResult.hasErrors).toBe(false);
    expect(validatorResult.hasWarnings).toBe(true);
    expect(
      validatorResult.hasFileWarningMessage(circularValidator.getDependencyCycleError(["dimB", "dimC", "dimE", "dimB"]))
    ).toBe(true);

    expect(
      validatorResult.hasFileWarningMessage(circularValidator.getDependencyCycleError(["dimD", "dimG", "dimF", "dimD"]))
    ).toBe(true);
  });
});
