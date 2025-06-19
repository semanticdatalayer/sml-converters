/**
 * Returns a new array with the elements sorted alphabetically based on the string value
 * returned by the provided selector function.
 *
 * @typeParam T - The type of elements in the input array.
 * @param array - The array of elements to sort.
 * @param selector - A function that takes an element and returns a string to use for sorting.
 * @returns A new array sorted alphabetically by the selected string value.
 */
export const sortAlphabetically = <T>(
  array: T[],
  selector: (el: T) => string
): T[] => {
  return [...array].sort((a, b) => selector(a).localeCompare(selector(b)));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepFreeze(o: any) {
  Object.freeze(o);

  Object.getOwnPropertyNames(o).forEach((prop) => {
    if (Object.prototype.hasOwnProperty.call(o, prop) &&
      o[prop] !== null &&
      (typeof o[prop] === "object" || typeof o[prop] === "function") &&
      !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });

  return o;
}
