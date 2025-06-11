export const isEqualCaseInsensitive = (name1: string, name2: string) =>
  name1?.toLocaleLowerCase() === name2?.toLocaleLowerCase();
