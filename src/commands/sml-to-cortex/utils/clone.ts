// TODO copied from package: we cannot import from package in api

export interface IIndexer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ICloneOptions {
  cloneFunctions: boolean;
}

const defaultOptions: ICloneOptions = {
  cloneFunctions: false,
};

export class CloneUtil {
  public static deep<T extends IIndexer>(
    source: T,
    inputOptions: Partial<ICloneOptions> = {},
  ): T {
    const options = { ...defaultOptions, ...inputOptions };

    // bottom
    if (source === undefined || source === null) {
      return source;
    }

    const isFunction = typeof source === 'function';
    const isObject = typeof source === 'object';

    if (!isFunction && !isObject) {
      return source;
    }

    if (isFunction) {
      return options.cloneFunctions ? source : (undefined as any as T);
    }

    if (Array.isArray(source)) {
      return source.map((sourceItem) =>
        CloneUtil.deep(sourceItem, options),
      ) as unknown as T;
    } else if (source instanceof Date) {
      return new Date(source.getTime()) as unknown as T;
    } else {
      const result: IIndexer = {};
      const keys = Object.keys(source);

      for (const key of keys) {
        result[key] = CloneUtil.deep(source[key] as T, options);
      }

      return result as T;
    }
  }

  public static cleanEmptyProperties<T extends IIndexer>(source: T): T {
    const clonedObject: IIndexer = {};
    for (const key in source) {
      const value = source[key];
      if (value === '' || value === undefined || value === null) {
        continue;
      }
      if (typeof value === 'object') {
        clonedObject[key] = CloneUtil.cleanEmptyProperties(value);
      } else {
        clonedObject[key] = value;
      }
    }
    return clonedObject as T;
  }
}
