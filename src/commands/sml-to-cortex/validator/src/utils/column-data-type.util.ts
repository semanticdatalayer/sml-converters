import { YamlColumDataTypeWithPrecision, YamlColumnDataType } from "models/src/yaml/IYamlDataset";
import EnumUtil from "utils/enum.util";

const allDataTypes = EnumUtil.getAllValues(YamlColumnDataType);

const allPrecisionDataTypes = EnumUtil.getAllValues(YamlColumDataTypeWithPrecision);

const getColumnTypeFromYaml = (yamlColumnType: string): YamlColumnDataType | undefined => {
  const foundMatch = allDataTypes.find((v) => yamlColumnType.startsWith(v));
  if (!foundMatch) {
    return undefined;
  }
  return foundMatch as YamlColumnDataType;
};

const hasColumnExactMatch = (yamlColumnType: string): boolean => allDataTypes.some((v) => v === yamlColumnType);

const getColumnTypeWithPrecisionFromYaml = (yamlColumnType: string): YamlColumDataTypeWithPrecision | undefined => {
  const foundMatch = allPrecisionDataTypes.find((v) => yamlColumnType.startsWith(v));
  if (!foundMatch) {
    return undefined;
  }
  return foundMatch as YamlColumDataTypeWithPrecision;
};

const isColumnPrecisionType = (yamlColumnType: YamlColumnDataType): boolean => {
  return allPrecisionDataTypes.some((v) => v === yamlColumnType);
};

const isValidPrecisionFormat = (data_type: string): boolean => {
  const precisionType = allPrecisionDataTypes.find((v) => data_type.startsWith(v));
  if (!precisionType) {
    return false;
  }

  const precisionPart = data_type.replace(precisionType, "");

  const precisionRegExpr = /^\(\d*,\d*\)$/gm;

  return precisionRegExpr.test(precisionPart);
};

const ColumnDataTypeUtil = {
  allDataTypes,
  getColumnTypeFromYaml,
  hasColumnExactMatch,
  isColumnPrecisionType,
  isValidPrecisionFormat,
  getColumnTypeWithPrecisionFromYaml,
};

export default ColumnDataTypeUtil;
