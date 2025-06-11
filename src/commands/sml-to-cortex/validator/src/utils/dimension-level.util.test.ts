import { IYamlDimensionLevel, IYamlDimensionLevelAttribute } from "models/src/yaml/IYamlDimension";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import DimensionLevelUtil from "./dimension-level.util";

const stringify = (val: boolean | undefined) => {
  if (val === undefined) {
    return "undefined";
  }

  return val;
};
describe("DimensionLevelUtil.isLevelHidden", () => {
  const testCases = [
    //levelHidden: true
    {
      levelHidden: true,
      attrHidden: undefined,
      expected: true,
    },
    {
      levelHidden: true,
      attrHidden: true,
      expected: true,
    },
    {
      levelHidden: true,
      attrHidden: false,
      expected: true,
    },
    //levelHidden: false
    {
      levelHidden: false,
      attrHidden: undefined,
      expected: false,
    },
    {
      levelHidden: false,
      attrHidden: true,
      expected: false,
    },
    {
      levelHidden: false,
      attrHidden: false,
      expected: false,
    },
    //levelHidden: undefined
    {
      levelHidden: undefined,
      attrHidden: undefined,
      expected: undefined,
    },
    {
      levelHidden: undefined,
      attrHidden: true,
      expected: true,
    },
    {
      levelHidden: undefined,
      attrHidden: false,
      expected: false,
    },
  ];

  testCases.forEach((testCase) => {
    const levelBuilder = AnyObjectBuilder.fromPartial<IYamlDimensionLevel>({
      unique_name: "level_unique_name",
    });
    const attrBuilder = AnyObjectBuilder.fromPartial<IYamlDimensionLevelAttribute>({
      unique_name: "attrUniqueName",
    });
    it(`Should return ${stringify(testCase.expected)} if level is_hidden is set to ${stringify(testCase.levelHidden)} and attribute is_hidden is set to ${stringify(testCase.attrHidden)}`, () => {
      const level = levelBuilder.with({ is_hidden: testCase.levelHidden }).build();
      const attribute = attrBuilder.with({ is_hidden: testCase.attrHidden }).build();
      const result = DimensionLevelUtil.isLevelHidden(level, attribute);

      expect(result).toEqual(testCase.expected);
    });
  });
});
