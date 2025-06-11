import EnvFileTypeValidator from "./EnvFileTypeValidator";

const envFiletypeValidator = new EnvFileTypeValidator();

describe("EnvFileTypeValidator.getErrors", () => {
  it("Should return empty array when content is formatted", async () => {
    const content = `first=first 
second=second`;

    const errors = envFiletypeValidator.getErrors(content);

    expect(errors).toHaveLength(0);
  });

  it("Should return empty array when one of the lines is a comment", async () => {
    const content = `#comment line
second=second`;

    const errors = envFiletypeValidator.getErrors(content);

    expect(errors).toHaveLength(0);
  });

  it("Should return error when variable name starts with a number", async () => {
    const content = `2first=first 
second=second`;

    const errors = envFiletypeValidator.getErrors(content);

    expect(errors).toHaveLength(1);
  });

  it("Should return errors when variable name has symbols different than letters, digits and underscore", async () => {
    const content = `first-variable=first 
second$=second`;

    const errors = envFiletypeValidator.getErrors(content);

    expect(errors).toHaveLength(2);
  });

  it("Should return error when there isn't = in one of the lines", async () => {
    const content = `first
second=second`;

    const errors = envFiletypeValidator.getErrors(content);

    expect(errors).toHaveLength(1);
  });

  it("Should return error key is missing", async () => {
    const content = `=first
second=second`;

    const errors = envFiletypeValidator.getErrors(content);

    expect(errors).toHaveLength(1);
  });

  it(`Should not produce an error when a newline is encoded as "\\r\\n"`, async () => {
    const content = "first=first\r\nsecond=second";

    const errors = envFiletypeValidator.getErrors(content);

    expect(errors).toHaveLength(0);
  });

  it(`Should not produce an error when a newline is encoded as "\\n"`, async () => {
    const content = "first=first\nsecond=second";

    const errors = envFiletypeValidator.getErrors(content);

    expect(errors).toHaveLength(0);
  });

  it(`Should separate lines correctly when new line is encoded as "\\r\\n"`, async () => {
    const content = "first-invalid-variable\r\nsecond-invalid-variable";

    const errors = envFiletypeValidator.getErrors(content);

    expect(errors[0]).toContain("Invalid format at line 1");
    expect(errors[1]).toContain("Invalid format at line 2");
  });

  it(`Should separate lines correctly when new line is encoded as "\\n"`, async () => {
    const content = "first-invalid-variable\nsecond-invalid-variable";

    const errors = envFiletypeValidator.getErrors(content);

    expect(errors[0]).toContain("Invalid format at line 1");
    expect(errors[1]).toContain("Invalid format at line 2");
  });
});
