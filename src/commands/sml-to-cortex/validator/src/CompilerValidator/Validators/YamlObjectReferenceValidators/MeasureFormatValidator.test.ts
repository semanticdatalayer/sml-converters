import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import { YamlFormatString } from "models/src/yaml/IYamlDataset";

import ValidatorOutput from "../../../ValidatorOutput/ValidatorOutput";
import MeasureFormatValidator, { measureFormatError } from "./MeasureFormatValidator";

const formats = {
  generalNumber: "General Number",
  custom: "custom",
  typeOfYamlFormatString: YamlFormatString.GeneralDate,
};

describe("Measure Format Validator", () => {
  it("should show error when the format has it but is in uppercase", () => {
    const validationOutput = ValidatorOutput.create();
    const measureFile = YamlMeasureBuilder.create()
      .with({
        format: formats.generalNumber,
      })
      .buildYamlFile();
    MeasureFormatValidator.validate(formats.generalNumber, measureFile, validationOutput);
    expect(
      validationOutput.hasFileErrorMessage(
        measureFormatError.formatNotCompatibleWithMeasureFormats(formats.generalNumber, YamlFormatString.GeneralNumber)
      )
    ).toBe(true);
  });

  it("should no error when the format is custom", () => {
    const validationOutput = ValidatorOutput.create();
    const measureFile = YamlMeasureBuilder.create()
      .with({
        format: formats.custom,
      })
      .buildYamlFile();
    MeasureFormatValidator.validate(formats.custom, measureFile, validationOutput);
    expect(validationOutput.hasErrors).toBe(false);
  });

  it("should no error when the format is from YamlFormatString", () => {
    const validationOutput = ValidatorOutput.create();
    const measureFile = YamlMeasureBuilder.create()
      .with({
        format: formats.typeOfYamlFormatString,
      })
      .buildYamlFile();
    MeasureFormatValidator.validate(formats.typeOfYamlFormatString, measureFile, validationOutput);
    expect(validationOutput.hasErrors).toBe(false);
  });
});
