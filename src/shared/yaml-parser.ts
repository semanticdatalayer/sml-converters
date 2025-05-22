import { JSON_SCHEMA, load } from "js-yaml";

export const parseYaml = (input: string): unknown => {
  return load(input, {
    schema: JSON_SCHEMA,
  });
};
