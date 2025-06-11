import YamlDimensionBuilder from "../builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlSerializer, { getYamlSerializerPropSorter } from "./YamlSerizlizer";

describe("YamlSerializer", () => {
  it("works without throwing an error", () => {
    const serializer = new YamlSerializer();
    const result = serializer.serialize(YamlDimensionBuilder.create().build());
    console.log(result);
    expect(result).toBeDefined();
  });
});

describe("yamlSerializerPropSorter", () => {
  const prop1 = "propZ1";
  const prop2 = "propV2";
  const prop3 = "propD3";
  const sortedProps = [prop1, prop2, prop3];
  const propA = "propAA";
  const propZ = "propZZ";

  const sorter = getYamlSerializerPropSorter(sortedProps);
  it("Having both properties in the top conf should return negative if first should be on top", () => {
    expect(sorter(prop1, prop2)).toBeLessThan(0);
  });

  it("Having both properties in the top conf should return positive if second should be on top", () => {
    expect(sorter(prop2, prop1)).toBeGreaterThan(0);
  });

  it("Having both properties in the top conf should return zero if values are equal", () => {
    expect(sorter(prop2, prop2)).toBe(0);
  });

  it("Having first prop in the top conf and second not in the top conf should return negative", () => {
    expect(sorter(prop2, propA)).toBeLessThan(0);
  });

  it("Having second prop in the top conf and first not in the top conf should return positive", () => {
    expect(sorter(propZ, prop2)).toBeGreaterThan(0);
  });

  it("Having both not in top list, should return negative if first is lexicaly before second", () => {
    expect(sorter(propA, propZ)).toBeLessThan(0);
  });

  it("Having both not in top list, should return positive if first is lexicaly after second", () => {
    expect(sorter(propZ, propA)).toBeGreaterThan(0);
  });

  it("Having both not in top list, should return zero if they are equal", () => {
    expect(sorter(propZ, propZ)).toBe(0);
  });
});
