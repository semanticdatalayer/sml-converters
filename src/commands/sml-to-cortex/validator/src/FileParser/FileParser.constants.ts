import IRawFile from "models/src/IRawFile";

export const getJsonRawFile = (rowFile: Partial<IRawFile> = {}): IRawFile => {
  const defaultContent: IRawFile = {
    rawContent: '"{\\"name\\":\\"John\\", \\"age\\":30, \\"car\\":null}"',
    relativePath: "test.json",
  };

  return Object.assign(defaultContent, rowFile);
};

export const getYamlRawFile = (rowFile: Partial<IRawFile> = {}): IRawFile => {
  const defaultContent: IRawFile = {
    rawContent:
      "name: Gender Dimension\nuniqueName: Gender Dimension.dimension\nobjectType: Dimension\nhierarchies:\n  - name: Gender Hierarchy\n    uniqueName: Gender Dimension.dimension.Gender Hierarchy\n    label: Gender Hierarchy\n    folder: Customer Attributes\n    levels:\n  - name: Gender\nattributes:\n  - name: Gender\n    uniqueName: Gender Dimension.dimension.Gender Hierarchy.Gender\n    label: Gender\n    dataset: dimgender\n    namecolumn: gendername\n    keycolumns:\n      - genderkey\n",
    relativePath: "test.yaml",
  };

  return Object.assign(defaultContent, rowFile);
};
