import { getYamlRawFile } from "../FileParser.constants";
import YamlFileParser from "./YamlFileParser";

describe("YamlFileParser", () => {
  it("should parse yaml string to a javascript object", () => {
    const rawFile = getYamlRawFile();
    const yamlParser = YamlFileParser.create();
    const result = yamlParser.parse(rawFile);

    expect(result.data).toHaveProperty("uniqueName");
  });
});
