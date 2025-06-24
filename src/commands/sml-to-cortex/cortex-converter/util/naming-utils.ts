import { SMLReferenceableObjectWithLabel } from "sml-sdk";
import { Logger } from "../../../../shared/logger";


export function ensureUnique(input: string, attrUniqueNames: Set<string>, logger: Logger): string {
  if (!attrUniqueNames.has(input)) {
    attrUniqueNames.add(input);
    return input;
  }
  let i = 1;
  let newString = input;
  while (attrUniqueNames.has(newString)) {
    newString = `${input}_${i}`;
    i++;
  }
  logger.warn(`Multiple instances of name '${input}' found so one instance is being changed to '${newString}'`); // TODO: Put this back
  attrUniqueNames.add(newString);
  return newString;
}

export function namingRules(str: string) {
  if (!str) return str;
  const originalStr = str;
  // Replace spaces with underscores
  str = str.replace(/\s+/g, "_");
  // Remove all characters that are not letters, underscores, digits, or dollar signs
  str = str.replace(/[^a-zA-Z0-9_$]/g, "_");
  str = str.toUpperCase();
  // Replace consecutive underscores with a single underscore
  str = str.replace(/_+/g, "_");
  // Remove initial underscore unless original string started with an underscore
  if (!originalStr.startsWith("_")) {
    str = str.replace(/^_/, ""); // Remove the leading underscore if the original didn't start with one
  }
  // Remove trailing underscores
  str = str.replace(/_+$/, "");
  return str;
}

// Extracts the name of the dim from a reference
export function dimNameOnly(reference: string): string {
  if (reference.includes("|")) return reference.substring(0, reference.indexOf("|"));
  return reference;
}

export function fmtForMsg(obj: SMLReferenceableObjectWithLabel): string {
  return obj.label == obj.unique_name ? `${obj.label}` : `${obj.label} (${obj.unique_name})`;
}

