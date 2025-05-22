export type AllRequiredInput = Array<[unknown, string]>;

export const getRequiredValueErrorMessage = (valueName: string): string =>
  `${valueName} is required`;

interface IErrorConstructor {
  new (message: string): Error;
}

class GuardImplementation {
  constructor(private ErrorConstructor: IErrorConstructor) {}

  forError(ErrorConstructor: IErrorConstructor): GuardImplementation {
    return new GuardImplementation(ErrorConstructor);
  }

  should(rule: boolean, msg: string): void {
    if (!rule) {
      throw new this.ErrorConstructor(msg);
    }
  }

  exists(object: unknown, msg: string): void {
    this.should(object !== null && object !== undefined, msg);
    if (typeof object === "number") {
      this.should(!isNaN(object), msg);
    }
  }

  notEmpty(value: string, msg: string): void {
    const notEmpty =
      value !== null && value !== undefined && value.trim() !== "";

    this.should(notEmpty, msg);
  }

  allRequired(values: AllRequiredInput): void {
    values.forEach(([value, valueName]) => {
      const msg = getRequiredValueErrorMessage(valueName);

      if (typeof value === "string") {
        this.notEmpty(value, msg);
      }
      this.exists(value, msg);
    });
  }

  ensure<T>(object: T | undefined | null, msg: string): T {
    this.exists(object, msg);
    if (!object) {
      throw new this.ErrorConstructor(msg);
    }

    return object;
  }

  ensureType<T>(
    object: NonNullable<unknown>,
    typeGuard: (input: any) => input is T,
    msg: string,
  ): T {
    if (typeGuard(object)) {
      return object;
    } else {
      throw new this.ErrorConstructor(msg);
    }
  }
}

export const Guard = new GuardImplementation(Error);

export default Guard;
