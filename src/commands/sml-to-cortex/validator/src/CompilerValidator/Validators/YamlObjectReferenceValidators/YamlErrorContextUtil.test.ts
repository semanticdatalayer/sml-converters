import { OutputCompilationType, OutputValidationType } from "models/src/IFileCompilationOutputContext";

import { YamlErrorContextInputProps } from "./IYamlErrorContexUtil";
import YamlErrorContextUtil from "./YamlErrorContextUtil";

const getContextProps = (props?: Partial<YamlErrorContextInputProps>): YamlErrorContextInputProps => {
  return {
    itemUniqueName: "level1",
    message: "Error message",
    validationType: OutputValidationType.customEmptyMember,
    ...props,
  };
};
describe("YamlErrorContextUtil", () => {
  let yamlErrorContextUtil: YamlErrorContextUtil;

  beforeEach(() => {
    yamlErrorContextUtil = new YamlErrorContextUtil();
  });

  describe("getLevelContext", () => {
    it("Should return the correct level context", () => {
      const props = { ...getContextProps(), hierarchyUniqueName: "hierarchy1" };

      const result = yamlErrorContextUtil.getLevelContext(props);

      expect(result.type).toBe(OutputCompilationType.Level);
      expect(result.level).toBe(props.itemUniqueName);
      expect(result.hierarchy).toBe(props.hierarchyUniqueName);
      expect(result.message).toBe(props.message);
      expect(result.validationType).toBe(props.validationType);
    });
  });

  describe("getLevelAttributeContext", () => {
    it("Should return the correct level attribute context", () => {
      const props = getContextProps();

      const result = yamlErrorContextUtil.getLevelAttributeContext(props);

      expect(result.type).toBe(OutputCompilationType.LevelAttribute);
      expect(result.levelAttribute).toBe(props.itemUniqueName);
      expect(result.message).toBe(props.message);
      expect(result.validationType).toBe(props.validationType);
    });
  });

  describe("getSecondaryAttributeContext", () => {
    it("Should return the correct secondary attribute context", () => {
      const props = getContextProps();

      const result = yamlErrorContextUtil.getSecondaryAttributeContext(props);

      expect(result.type).toBe(OutputCompilationType.SecondaryAttribute);
      expect(result.secondaryAttribute).toBe(props.itemUniqueName);
      expect(result.message).toBe(props.message);
      expect(result.validationType).toBe(props.validationType);
    });
  });
});
