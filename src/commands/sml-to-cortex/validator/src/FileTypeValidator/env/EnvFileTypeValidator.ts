import { IFileTypeValidator } from "../model";

const isEnvLineValid = (line: string): boolean => {
  if (line.trim() === "" || line.trim().startsWith("#")) {
    return true;
  }

  const envVariableRegex = /^[A-Za-z_]+[A-Za-z0-9_]*=(.*)$/;

  return envVariableRegex.test(line);
};

export default class EnvFileTypeValidator implements IFileTypeValidator {
  getErrors(content: string): string[] {
    const result: Array<string> = [];
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (!isEnvLineValid(line)) {
        result.push(`Invalid format at line ${index + 1}: "${line}"`);
      }
    });

    return result;
  }
}
