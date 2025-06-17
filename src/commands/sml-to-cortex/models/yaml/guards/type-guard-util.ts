/* eslint-disable @typescript-eslint/no-explicit-any */
export default class TypeGuardUtil {
  static hasProps<T>(obj: any, ...keys: Array<keyof T>): boolean {
    const allProps = Object.keys(obj);
    return keys.every((prop) => {
      return allProps.includes(prop.toString());
    });
  }

  static hasNoProps<T>(obj: any, ...keys: Array<keyof T>): boolean {
    const allProps = Object.keys(obj);
    return keys.every((prop) => {
      return !allProps.includes(prop.toString());
    });
  }
}
