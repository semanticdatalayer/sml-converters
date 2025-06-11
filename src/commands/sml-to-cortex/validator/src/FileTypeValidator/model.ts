export interface IFileTypeValidator {
  getErrors(content: string): Array<string>;
}

export interface IFileTypeValidatorFactory {
  getValidator(path: string): IFileTypeValidator;
}
