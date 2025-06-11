/* eslint-disable @typescript-eslint/no-explicit-any */
import { FileOutputAppender } from "../../../ValidatorOutput/ValidatorOutput";
import { IValidateUniqueNamesContext } from "./IYamlValidatorUtil";

export default class YamlValidatorUtil {
  static groupBy<T>(items: Array<T>, getObjectKeys: (item: T) => Array<any>): Map<string, Array<T>> {
    return items.reduce((map, item) => {
      const key = JSON.stringify(getObjectKeys(item));
      const values = map.get(key) || [];
      values.push(item);
      map.set(key, values);
      return map;
    }, new Map<string, Array<T>>());
  }

  static appendErrorsIfDuplicates<T>(
    map: Map<string, Array<T>>,
    fileAppender: FileOutputAppender,
    getError: (item: T, itemCount: number) => string
  ): void {
    this.processDuplicates(map, (v) => {
      const error = getError(v[0], v.length);
      fileAppender.addError(error);
    });
  }

  static appendErrorsWithContextIfDuplicates<T>(
    map: Map<string, Array<T>>,
    fileAppender: FileOutputAppender,
    getError: (item: T, itemCount: number) => string,
    context: IValidateUniqueNamesContext
  ): void {
    const { getContext, hierarchyUniqueName } = context;
    this.processDuplicates(map, (v) => {
      const error = getError(v[0], v.length);
      const errorContext = getContext(v[0] as string, hierarchyUniqueName);
      fileAppender.addErrorWithContext(error, errorContext);
    });
  }

  static processDuplicates<T>(map: Map<string, Array<T>>, handleDuplicate: (duplicates: Array<T>) => void): void {
    Array.from(map.values())
      .filter((v) => v.length > 1)
      .forEach(handleDuplicate);
  }

  static checkIfDuplicateNameExists(arr: Array<string>): boolean {
    return new Set(arr).size !== arr.length;
  }

  static findCommonElement<T>(sets: Set<T>[]) {
    if (sets.length < 2) {
      return null;
    }

    const otherSets = [...sets];
    const firstSet = otherSets.splice(0, 1)[0];

    for (const element of firstSet) {
      if (otherSets.every((s) => s.has(element))) {
        return element;
      }
    }
    return null;
  }
}
