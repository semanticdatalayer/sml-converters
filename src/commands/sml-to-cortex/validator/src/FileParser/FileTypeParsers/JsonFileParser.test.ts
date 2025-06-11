import { getJsonRawFile } from "../FileParser.constants";
import JsonFileParser from "./JsonFileParser";

describe("JsonFileParser", () => {
  it("should parse json string to a javascript object", () => {
    const rawFile = getJsonRawFile();
    const jsonParser = JsonFileParser.create();
    const result = jsonParser.parse(rawFile);

    expect(result.data).toBe(JSON.parse(rawFile.rawContent));
  });
});
