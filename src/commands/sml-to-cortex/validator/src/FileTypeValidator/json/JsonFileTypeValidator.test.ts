import JsonFileTypeValidator from "./JsonFileTypeValidator";

describe("JsonFileTypeValidator.getErrors", () => {
  it("Should return empty array if no errors are found", async () => {
    const content =
      '{"type":"Customer","name":"Svetoslav","locations":[{"city":"Sofia","country":"Bulgaria"},{"city":"Boston","country":"USA"}]}';
    const errors = new JsonFileTypeValidator().getErrors(content);
    expect(errors).toHaveLength(0);
  });

  it("Should return none-array if invalid yaml is provided", async () => {
    const content = '{"type":"Customer","name":"Svetoslav","locations":"SomeOTherProp":"aaa"}';
    const errors = new JsonFileTypeValidator().getErrors(content);
    expect(errors).not.toHaveLength(0);
  });
});
