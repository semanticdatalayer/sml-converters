import { ErrorObject } from "ajv/dist/2020";
import TypeGuardUtil from "models/src/yaml/guards/type-guard-util";
import { IYamlObject } from "models/src/yaml/IYamlObject";

interface IYamlObjectIndexer<T> {
  [key: string]: T;
}

export class SchemaValidatorErrorFormatter {
  filterAnyOfErrors(errors: Array<ErrorObject>): Array<ErrorObject> {
    //whatever we do - we should not fail try/catch
    try {
      const anyOfErrors = errors.filter((e) => e.keyword === "anyOf");
      if (anyOfErrors.length === 0) {
        return errors;
      }

      const representativeErrors = anyOfErrors.map((anyError) => {
        const representativeError = errors.find((e) => e.schemaPath.startsWith(anyError.schemaPath));
        //fallback to anyError if no representative is found
        return representativeError ?? anyError;
      });

      //remove all errors connected to anyOf
      const errorsWithoutAnyOf = errors.filter((e) =>
        anyOfErrors.every((anyError) => !e.schemaPath.startsWith(anyError.schemaPath) && e.keyword !== "anyOf")
      );

      //append the representative errors
      return [...errorsWithoutAnyOf, ...representativeErrors];
    } catch (e) {
      return errors;
    }
  }

  formatErrors(errors: Array<ErrorObject>, data: IYamlObject): Array<string> {
    const filteredErrors = this.filterAnyOfErrors(errors);
    return filteredErrors.reduce((result: Array<string>, error) => {
      const errorMessage = this.formatSingleError(error, data);

      result.push(errorMessage);

      return result;
    }, []);
  }

  private formatSingleError(error: ErrorObject, yamlObject: IYamlObject, errorMessage = ""): string {
    const paths = this.splitInstancePath(error.instancePath);
    const [propName, propKeyOrIndex] = paths;

    if (!propName) {
      return errorMessage ? `${errorMessage}${error.message}` : error.message!;
    }

    if (!propKeyOrIndex) {
      errorMessage = `${errorMessage}${propName} ${error.message}`;
      return errorMessage;
    }

    const { subYamlObject, newErrorMessage, newInstancePath } = this.isIndex(propKeyOrIndex)
      ? this.updateDataFromCollection(yamlObject, propName, propKeyOrIndex, paths, errorMessage)
      : this.updateDataFromObject(yamlObject, propName, propKeyOrIndex, paths, errorMessage);

    error.instancePath = newInstancePath;

    return this.formatSingleError(error, subYamlObject, newErrorMessage);
  }

  private updateDataFromCollection(
    data: IYamlObject,
    propName: string,
    propIndex: string,
    paths: string[],
    errorMessage: string
  ) {
    const subYamlObject = (data as unknown as IYamlObjectIndexer<Array<IYamlObject>>)[propName][parseInt(propIndex)];
    const dataName = this.getDataName(subYamlObject, propIndex);
    const newInstancePath = paths.slice(paths.indexOf(propIndex) + 1).join("/");
    const newErrorMessage = `${errorMessage}${propName}[${dataName}]` + this.getMessageSeparator(newInstancePath);

    return { subYamlObject, newErrorMessage, newInstancePath };
  }

  private updateDataFromObject(
    data: IYamlObject,
    propName: string,
    propKey: string,
    paths: string[],
    errorMessage: string
  ) {
    const subYamlObject = (data as unknown as IYamlObjectIndexer<IYamlObject>)[propName];
    const newInstancePath = paths.slice(paths.indexOf(propKey)).join("/");
    const newErrorMessage = `${errorMessage}${propName}` + this.getMessageSeparator(newInstancePath);
    return { subYamlObject, newErrorMessage, newInstancePath };
  }

  private isIndex(input: string): boolean {
    return typeof input === "string" && !Number.isNaN(parseInt(input));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getDataName(propValue: any, propIndex: string): string {
    if (!propValue) {
      return `index: ${propIndex}`;
    }

    if (TypeGuardUtil.hasProps(propValue, "name")) {
      return `name=${propValue.name}`;
    }
    if (TypeGuardUtil.hasProps(propValue, "label")) {
      return `label=${propValue.label}`;
    }
    if (TypeGuardUtil.hasProps(propValue, "unique_name")) {
      return `unique_name=${propValue.unique_name}`;
    }

    return `index: ${propIndex}`;
  }

  private getMessageSeparator(path: string): string {
    return this.splitInstancePath(path).length <= 1 ? " " : " -> ";
  }

  private splitInstancePath(instancePath: string): Array<string> {
    return instancePath.split("/").filter(Boolean);
  }
}
