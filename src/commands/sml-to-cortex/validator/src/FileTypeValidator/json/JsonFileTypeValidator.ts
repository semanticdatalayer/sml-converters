import { IFileTypeValidator } from "../model";

export default class JsonFileTypeValidator implements IFileTypeValidator {
  getErrors(content: string): string[] {
    try {
      JSON.parse(content);
      return [];
    } catch (e) {
      if (typeof e === "string") {
        return [e];
      } else if (e instanceof Error) {
        return [e.message];
      } else {
        return [`${e}`];
      }
    }
  }
}
