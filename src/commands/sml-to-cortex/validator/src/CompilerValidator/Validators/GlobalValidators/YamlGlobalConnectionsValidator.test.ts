import { YamlQueriesBuilder } from "../../../builders/YamlQueriesBuilder";
import { YamlGlobalConnectionsValidator, yamlGlobalConnectionsValidatorErrors } from "./YamlGlobalConnectionsValidator";

const yamlQueriesBuilder = YamlQueriesBuilder.create();

const getValidator = (result: Map<string, string[]>): YamlGlobalConnectionsValidator => {
  const yamlQuery = yamlQueriesBuilder.getAllDataWarehouseConnectionsUsedInRepo.result(result).build();
  return YamlGlobalConnectionsValidator.create(yamlQuery);
};

describe("YamlGlobalConnectionsValidator", () => {
  it("Should add no error is 1 dw connection", () => {
    const validator = getValidator(new Map().set("test", ["con1"]));
    const result = validator.validate([]);
    expect(result.globalOutput).toHaveLength(0);
  });

  it("Should add no error is no dw connection", () => {
    const validator = getValidator(new Map());
    const result = validator.validate([]);
    expect(result.globalOutput).toHaveLength(0);
  });

  it("Should add error if tehre are more than one dw connections", () => {
    const connectionsOutput = ["con1", "snowflake", "databricks"];
    const validator = getValidator(new Map().set("test", connectionsOutput));
    const result = validator.validate([]);
    expect(result.globalOutput).toHaveLength(1);
    expect(result.globalOutput[0].message).toEqual(
      yamlGlobalConnectionsValidatorErrors.getMultiDwError("test", connectionsOutput)
    );
  });
});
