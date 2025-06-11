// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DeepReadonly<T> = T extends (...args: Array<unknown>) => unknown
  ? T
  : { readonly [P in keyof T]: DeepReadonly<T[P]> };
