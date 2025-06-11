import EnvFileParser from "./EnvFileParser";

const envFileParser = EnvFileParser.create();

describe("EnvFileParser", () => {
  it("should parse valid env file content to javascript object", () => {
    const rawFile = {
      relativePath: ".env",
      rawContent: `first=first
      second=second`,
    };

    const result = envFileParser.parse(rawFile);

    expect(result.data).toEqual({ first: "first", second: "second" });
  });
});
