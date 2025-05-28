type ResultType = "string" | "number";

type GetResultType<T extends ResultType> = T extends "string" ? string : number;

const getAllValues = <T extends ResultType = "string">(
  input: any,
  resultType?: T,
): Array<GetResultType<T>> => {
  const values = Object.values(input);

  if (resultType === "number") {
    // Filter out only actual numeric values
    return values.filter((v): v is number => typeof v === "number") as Array<
      GetResultType<T>
    >;
  }

  // Default to string — filter only string values
  return values.filter((v): v is string => typeof v === "string") as Array<
    GetResultType<T>
  >;
};

export const enumUtil = {
  getAllValues,
};
