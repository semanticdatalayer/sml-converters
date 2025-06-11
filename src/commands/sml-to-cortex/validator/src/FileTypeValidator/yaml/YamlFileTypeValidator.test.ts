import YamlFileTypeValidator from "./YamlFileTypeValidator";

describe("YamlFileTypeValidator.getErrors", () => {
  it("Should return empty array if no errors are found", async () => {
    const content =
      "type: Customer\nname: Svetoslav\nlocations:\n - city: Sofia\n   country: Bulgaria\n\n - city: Boston\n   country: USA";
    const errors = new YamlFileTypeValidator().getErrors(content);
    expect(errors).toHaveLength(0);
  });

  it("Should return none-array if invalid yaml is provided", async () => {
    const content = "type: Customer\nname: Svetoslav\nlocations:\n -city: Sofia\n  country: Bulgaria";
    const errors = new YamlFileTypeValidator().getErrors(content);
    expect(errors).not.toHaveLength(0);
  });
});
