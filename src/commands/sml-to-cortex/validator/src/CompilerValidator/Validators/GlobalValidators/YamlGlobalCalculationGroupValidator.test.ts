import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import { YamlDimensionRelationType } from "models/src/yaml/IYamlDimension";

import {
  YamlGlobalCalculationGroupValidator,
  yamlGlobalProjectValidatorErrors,
} from "./YamlGlobalCalculationGroupValidator";

const globalProjectValidatorMock = YamlGlobalCalculationGroupValidator.create();
const yamlDimensionBuilder = YamlDimensionBuilder.create();
const yamlModelBuilder = YamlModelBuilder.create();

describe("YamlGlobalProjectValidator", () => {
  it("Should not add error if there are no duplicated calculation group names", () => {
    const yamlDimMock = yamlDimensionBuilder
      .addCalculationGroup({ unique_name: "testGroup" })
      .addCalculationGroup({ unique_name: "testGroup1" })
      .buildYamlFileForPackage();
    const yamlDimMock1 = yamlDimensionBuilder
      .addCalculationGroup({ unique_name: "testGroup2" })
      .buildYamlFileForPackage();

    const result = globalProjectValidatorMock.validate([yamlDimMock, yamlDimMock1]);
    expect(result.filesOutput).toHaveLength(0);
  });

  it("Should not add error if there are duplicated calculation group names in not used dimension", () => {
    const yamlDimMock = yamlDimensionBuilder.addCalculationGroup().addCalculationGroup().buildYamlFileForPackage();

    const result = globalProjectValidatorMock.validate([yamlDimMock]);
    expect(result.filesOutput).toHaveLength(0);
  });

  it("Should add error if there are duplicated calculation group names in one used dimension", () => {
    const dimNameMock = "dimNameMock";
    const yamlDimMock = yamlDimensionBuilder
      .with({ unique_name: dimNameMock })
      .addCalculationGroup()
      .addCalculationGroup()
      .buildYamlFileForPackage();

    const yamlModelMock = yamlModelBuilder
      .addRelationship({
        to: {
          dimension: dimNameMock,
          level: "",
        },
      })
      .buildYamlFileForPackage();

    const result = globalProjectValidatorMock.validate([yamlModelMock, yamlDimMock]);
    expect(result.filesOutput).toHaveLength(1);
    expect(
      result.hasFileErrorMessage(yamlGlobalProjectValidatorErrors.duplicateCalcGroupNameInDimension())
    ).toBeTruthy();
  });

  it("Should add error if there are duplicated calculation group names in different used dimensions", () => {
    const calcGroupNameMock = "testGroupName";
    const firstDimNameMock = "firstDimNameMock";
    const secondDimNameMock = "secondDimNameMock";

    const yamlDimMock = yamlDimensionBuilder
      .with({ unique_name: firstDimNameMock })
      .addRelationship({
        to: {
          dimension: secondDimNameMock,
          level: "",
        },
        type: YamlDimensionRelationType.Embedded,
      })
      .addCalculationGroup({ unique_name: calcGroupNameMock })
      .buildYamlFileForPackage();

    const yamlDimMock1 = yamlDimensionBuilder
      .with({ unique_name: secondDimNameMock })
      .addCalculationGroup({ unique_name: calcGroupNameMock })
      .buildYamlFileForPackage();

    const yamlModelMock = yamlModelBuilder
      .addRelationship({
        to: {
          dimension: firstDimNameMock,
          level: "",
        },
      })
      .buildYamlFileForPackage();

    const result = globalProjectValidatorMock.validate([yamlModelMock, yamlDimMock, yamlDimMock1]);
    expect(result.filesOutput).toHaveLength(2);
    expect(
      result.hasFileErrorMessage(
        yamlGlobalProjectValidatorErrors.duplicateCalcGroupNamesInDimensions([calcGroupNameMock], secondDimNameMock)
      )
    ).toBeTruthy();
    expect(
      result.hasFileErrorMessage(
        yamlGlobalProjectValidatorErrors.duplicateCalcGroupNamesInDimensions([calcGroupNameMock], firstDimNameMock)
      )
    ).toBeTruthy();
  });
});
