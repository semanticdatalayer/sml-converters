import {
  ICompilationOutput,
  IFileCompilationOutput,
  IValidationOutputContext,
  Severity,
  ValidationSource,
} from "models/src/IFileCompilationOutput";

import { IRepoValidatorResult } from "../RepoValidator/IRepoValidator";

class GlobalOutputAppender {
  constructor(private readonly validator: ValidatorOutput) {}

  add(severity: Severity, message: string) {
    this.validator.addGlobalOutput(severity, message);
  }

  addError(message: string) {
    this.add(Severity.Error, message);
  }

  addWarning(message: string) {
    this.add(Severity.Warning, message);
  }

  addInfo(message: string) {
    this.add(Severity.Info, message);
  }
}

export interface IAddValidationProps {
  severity: Severity;
  message: string;
  context?: IValidationOutputContext;
  validationSource?: ValidationSource;
}

export interface IAddFileOutputProps extends IAddValidationProps {
  filePath: string;
}

export class FileOutputAppender {
  constructor(
    private readonly validator: ValidatorOutput,
    private readonly file: IFileWithRelativePath | string
  ) {}

  private get relativePath() {
    return typeof this.file === "string" ? this.file : this.file.relativePath;
  }

  add(severity: Severity, message: string, context?: IValidationOutputContext) {
    this.validator.addFileOutput(this.relativePath, severity, message, context);
  }

  addRaw(compilationOutput: ICompilationOutput) {
    this.validator.addFileOutputRaw(this.relativePath, compilationOutput);
  }

  addError(message: string) {
    this.add(Severity.Error, message);
  }

  addErrorWithContext(message: string, context: IValidationOutputContext) {
    this.add(Severity.Error, message, context);
  }

  addWarning(message: string) {
    this.add(Severity.Warning, message);
  }

  addWarningWithContext(message: string, context: IValidationOutputContext) {
    this.add(Severity.Warning, message, context);
  }

  addInfo(message: string) {
    this.add(Severity.Info, message);
  }
}

export interface IFileWithRelativePath {
  relativePath: string;
}

export default class ValidatorOutput implements IRepoValidatorResult {
  static create(seed?: IRepoValidatorResult, validationSource?: ValidationSource) {
    return new ValidatorOutput(seed, validationSource);
  }

  static createForEngine() {
    return new ValidatorOutput(undefined, ValidationSource.Engine);
  }

  readonly globalOutput: Array<ICompilationOutput>;
  readonly filesOutput: Array<IFileCompilationOutput>;
  readonly validationSource?: ValidationSource;
  public constructor(seed?: IRepoValidatorResult, validationSource?: ValidationSource) {
    this.globalOutput = seed?.globalOutput || [];
    this.filesOutput = seed?.filesOutput || [];
    this.validationSource = validationSource;
  }

  addFileOutput(filePath: string, severity: Severity, message: string, context?: IValidationOutputContext) {
    this.addFileOutputRaw(filePath, { severity, message, context, validationSource: this.validationSource });
  }

  addFileOutputRaw(filePath: string, compilationOutput: ICompilationOutput) {
    const existingFile = this.filesOutput.find((f) => f.relativePath === filePath);
    if (!existingFile) {
      this.filesOutput.push({
        relativePath: filePath,
        compilationOutput: [compilationOutput],
      });
    } else {
      const isDuplicate = existingFile.compilationOutput.some(
        ({ message, severity }) => message === compilationOutput.message && severity === compilationOutput.severity
      );

      if (isDuplicate) {
        return;
      }

      existingFile.compilationOutput.push(compilationOutput);
    }
  }

  addGlobalOutput(severity: Severity, message: string) {
    this.globalOutput.push({ severity, message, validationSource: this.validationSource });
  }

  hasGlobalMessage = (errorMessage: string): boolean => {
    const foundMessage = this.globalOutput.some((output) => output.message === errorMessage);

    return foundMessage;
  };

  global() {
    return new GlobalOutputAppender(this);
  }

  file(file: IFileWithRelativePath) {
    return new FileOutputAppender(this, file);
  }

  getFileOutput(file: IFileWithRelativePath | string, severity?: Severity) {
    const filePath = typeof file === "string" ? file : file.relativePath;
    const result = this.filesOutput.find((f) => f.relativePath === filePath)?.compilationOutput || [];

    if (severity) {
      return result.filter((x) => x.severity === severity);
    }
    return result;
  }

  getFilesWithErrors() {
    return this.filesOutput.filter((f) => f.compilationOutput.some((x) => x.severity === Severity.Error));
  }

  append(validatorOutput: IRepoValidatorResult) {
    if (validatorOutput.globalOutput.length > 0) {
      this.globalOutput.push(...validatorOutput.globalOutput);
    }
    validatorOutput.filesOutput.forEach((f) => {
      f.compilationOutput.forEach((o) => {
        this.file(f).addRaw(o);
      });
    });
  }

  hasFileWarningMessage = (warningMessage: string) => {
    const foundWarning = this.filesOutput.some((fileOutput) =>
      fileOutput.compilationOutput.some((o) => o.message === warningMessage && o.severity === Severity.Warning)
    );

    return foundWarning;
  };

  hasFileErrorMessage = (errorMessage: string): boolean => {
    const foundError = this.filesOutput.some((fileOutput) =>
      fileOutput.compilationOutput.some((o) => o.message === errorMessage && o.severity === Severity.Error)
    );

    return foundError;
  };

  hasFileInfoMessage = (infoMessage: string): boolean => {
    return this.filesOutput.some((fileOutput) =>
      fileOutput.compilationOutput.some((o) => o.message === infoMessage && o.severity === Severity.Info)
    );
  };

  get hasErrors() {
    return (
      this.globalOutput.some((x) => x.severity === Severity.Error) ||
      this.filesOutput.flatMap((f) => f.compilationOutput).some((x) => x.severity === Severity.Error)
    );
  }

  get hasWarnings() {
    return (
      this.globalOutput.some((x) => x.severity === Severity.Warning) ||
      this.filesOutput.flatMap((f) => f.compilationOutput).some((x) => x.severity === Severity.Warning)
    );
  }

  get hasInfos() {
    return (
      this.globalOutput.some((x) => x.severity === Severity.Info) ||
      this.filesOutput.flatMap((f) => f.compilationOutput).some((x) => x.severity === Severity.Info)
    );
  }

  get output(): IRepoValidatorResult {
    return {
      filesOutput: this.filesOutput,
      globalOutput: this.globalOutput,
    };
  }
}
