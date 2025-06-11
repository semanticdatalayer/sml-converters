import FileTypeValidatorFactory from "./FileTypeValidatorFactory";

describe("FileTypeValidatorFactory.getExtensionFromPath", () => {
  const tests = [
    { input: "customer.yml", expected: "yml" },
    { input: "/customer.yml", expected: "yml" },
    { input: "./customer.yml", expected: "yml" },
    { input: "/folder/customer.yml", expected: "yml" },
    { input: "/folder/subfolder/customer.dimension.yml", expected: "yml" },
    { input: ".gitignore", expected: "gitignore" },
    { input: "/folder/customer", expected: undefined },
    { input: "/folder/customer.", expected: undefined },
  ];

  tests.forEach((t) => {
    it(`Given input: '${t.input}' should return '${t.expected || "undefined"}'`, () => {
      const factory = new FileTypeValidatorFactory();
      const result = factory.getExtensionFromPath(t.input);
      expect(result).toEqual(t.expected);
    });
  });
});
