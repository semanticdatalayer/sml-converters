import yaml from "js-yaml";

import {
  SMLObject,
  SMLPackageFile
} from "sml-sdk";

// import { IYamlObject } from "../yaml/IYamlObject";
// import { IYamlPackageFile } from "../yaml/IYamlPackageFile";
import { IYamlSerializer } from "./IYamlSerializer";

type YamlObjectProp = keyof SMLObject;
type YamlPackageProps = keyof SMLPackageFile;

const commonObjectPropsOrdered: Array<YamlObjectProp | YamlPackageProps> = [
  "version",
  "unique_name",
  "object_type",
  "label",
  "packages",
];

const yamlTopItemsOrdered: Array<string> = [...commonObjectPropsOrdered, "name", "description", "url", "branch"];

export const getYamlSerializerPropSorter =
  (topProps: Array<string> = yamlTopItemsOrdered) =>
  (a: string, b: string): number => {
    if (a === b) {
      return 0;
    }

    const indexOfA = topProps.indexOf(a);
    const indexOfB = topProps.indexOf(b);

    if (indexOfA >= 0) {
      return indexOfB >= 0 ? indexOfA - indexOfB : -1;
    } else {
      return indexOfB >= 0 ? 1 : a.localeCompare(b);
    }
  };
export default class YamlSerializer implements IYamlSerializer {
  serialize(input: object): string {
    return yaml.dump(input, {
      sortKeys: getYamlSerializerPropSorter(),
    });
  }
}
