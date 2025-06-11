import { IYamlObject } from "../../yaml/IYamlObject";

export const getFreezedObject = <T>(input: T): T => {
  return Object.freeze(input);
};

export const getAggregatedResult = <TObjectType extends IYamlObject, T extends object>(
  input: T
): T & { all: Array<TObjectType> } => {
  const all: Array<TObjectType> = [];
  Object.keys(input).forEach((propKey) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    all.push((input as any)[propKey] as TObjectType);
  });

  return {
    ...input,
    all,
  };
};
