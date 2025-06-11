import { FileOutputAppender } from "../../../ValidatorOutput/ValidatorOutput";
import { IValidateUniqueNamesContext } from "./IYamlValidatorUtil";
import YamlValidatorUtil from "./YamlValidatorUtil";

type Element = { key: string };

const firstEl: Element = { key: "test1" };
const secondEl: Element = { key: "test2" };

const mapWithDuplicates = new Map<string, Array<Element>>([
  ['["test1"]', [firstEl, firstEl]],
  ['["test2"]', [secondEl]],
]);
const mapWithoutDuplicates = new Map<string, Array<Element>>([
  ['["test1"]', [firstEl]],
  ['["test2"]', [secondEl]],
]);

const getError = jest.fn().mockReturnValue("error");
const getContext = jest.fn().mockReturnValue("context");
const context: IValidateUniqueNamesContext = {
  getContext,
  hierarchyUniqueName: "hierarchy",
};

describe("YamlValidatorUtil.groupBy", () => {
  it("Should return a Map with entries (an array with one value) if different keys are provided", () => {
    const input = [firstEl, secondEl];
    const map = YamlValidatorUtil.groupBy(input, (x) => Object.values(x));
    const mapValues = Array.from(map.values());
    const [firstValue, secondValue] = mapValues;

    expect(map.size).toBe(2);
    expect(firstValue).toEqual([firstEl]);
    expect(secondValue).toEqual([secondEl]);
  });

  it("Should return a Map with one entry (an array with multiple values) if the same key is provided", () => {
    const input = [firstEl, secondEl];
    const map = YamlValidatorUtil.groupBy(input, (x) => Object.keys(x));
    const mapValues = Array.from(map.values());

    expect(map.size).toBe(1);
    expect(mapValues[0]).toEqual([firstEl, secondEl]);
  });
});

describe("YamlValidatorUtil appending errors", () => {
  let fileAppender: FileOutputAppender;

  beforeEach(() => {
    fileAppender = {
      addError: jest.fn(),
      addErrorWithContext: jest.fn(),
    } as unknown as FileOutputAppender;
  });
  describe("YamlValidatorUtil.appendErrorsIfDuplicates", () => {
    it("Should append errors to the file appender for each duplicate item", () => {
      YamlValidatorUtil.appendErrorsIfDuplicates(mapWithDuplicates, fileAppender, getError);

      expect(fileAppender.addError).toHaveBeenCalledTimes(1);
      expect(fileAppender.addError).toHaveBeenCalledWith(getError());
    });

    it("Should not append any errors if there are no duplicate items", () => {
      YamlValidatorUtil.appendErrorsIfDuplicates(mapWithoutDuplicates, fileAppender, getError);

      expect(fileAppender.addError).not.toHaveBeenCalled();
    });
  });
  describe("YamlValidatorUtil.appendErrorsWithContextIfDuplicates", () => {
    it("Should append errors with context to the file appender for each duplicate item", () => {
      YamlValidatorUtil.appendErrorsWithContextIfDuplicates(mapWithDuplicates, fileAppender, getError, context);

      expect(fileAppender.addErrorWithContext).toHaveBeenCalledTimes(1);
      expect(fileAppender.addErrorWithContext).toHaveBeenCalledWith(getError(), getContext());
    });

    it("Should not append any errors if there are no duplicate items", () => {
      YamlValidatorUtil.appendErrorsWithContextIfDuplicates(mapWithoutDuplicates, fileAppender, getError, context);

      expect(fileAppender.addErrorWithContext).not.toHaveBeenCalled();
    });
  });
});
