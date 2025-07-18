import { 
  SMLEmbeddedRelationship, 
  SMLModelRegularRelationship, 
  SMLModelRelationship, 
  SMLReferenceableObjectWithLabel 
} from "sml-sdk";
import { Logger } from "../../../shared/logger";

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

export function transformName(str: string) {
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

/**
 * Replace '{0}' with the replacement variable
 * @param roleplay string with the replacement {0}
 * @param replacement string to replace {0}
 * @returns roleplay string with the {0} replaced
 */
export function replacePlaceholder(roleplay: string, replacement: string): string {
  return roleplay.replace("{0}", replacement);
}

/**
 * Adds one or more values to a Set stored in a Map. If the key doesn't exist,
 * creates a new Set with the provided value(s). If the key exists, adds the
 * value(s) to the existing Set.
 * 
 * @param map - The Map containing string keys and Set<string> values
 * @param key - The key to add values to
 * @param value - A single string or array of strings to add to the Set
 */
export function addToMapWithSet(map: Map<string, Set<string>>, key: string, value: string | string[]) {
  let temp = new Set<string>();
  const val = map.get(key);
  if (val) temp = val;
  if (Array.isArray(value)) value.forEach((val2) => temp.add(val2));
  else temp.add(value);
  map.set(key, temp);

}
export function isRegularRelationship(relationship: SMLModelRelationship): relationship is SMLModelRegularRelationship {
  return 'dimension' in relationship.to;
}

export function fmtDimRef(relationship: SMLModelRelationship | SMLEmbeddedRelationship, roleplay: string): string {
  if (isRegularRelationship(relationship)) {
    if (relationship.role_play) {
      if (roleplay) {
        return `${relationship.to.dimension}|${replacePlaceholder(roleplay, relationship.role_play)}`;
      }
      return `${relationship.to.dimension}|${relationship.role_play}`;
    } else if (roleplay) {
      return `${relationship.to.dimension}|${roleplay}`;
    }
    return relationship.to.dimension;
  }
  throw new Error(`Missing 'dimension' property in TO of relationship from ${relationship.from.dataset}`);
}
