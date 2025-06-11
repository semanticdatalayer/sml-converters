import IYamlParsedFile from "models/src/IYamlParsedFile";
import { YamlFormatString } from "models/src/yaml/IYamlDataset";
import EnumUtil from "utils/enum.util";

import { isEqualCaseInsensitive } from "../../../utils/compare.util";
import ValidatorOutput from "../../../ValidatorOutput/ValidatorOutput";

export const measureFormatError = {
  formatNotCompatibleWithMeasureFormats: (formatString: string, realFormatValue: string): string =>
    `Invalid format value "${formatString}" you probably mean "${realFormatValue}"!`,
};

export default class MeasureFormatValidator {
  static validate(formatString: string, file: IYamlParsedFile, validatorOutput: ValidatorOutput) {
    const allValues = EnumUtil.getAllValues(YamlFormatString, "string");
    const realFormatValue = allValues.find((v) => isEqualCaseInsensitive(v, formatString));
    if (realFormatValue && realFormatValue !== formatString) {
      validatorOutput
        .file(file)
        .addError(measureFormatError.formatNotCompatibleWithMeasureFormats(formatString, realFormatValue));
    }
  }
}
