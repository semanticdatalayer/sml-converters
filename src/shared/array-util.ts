
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
