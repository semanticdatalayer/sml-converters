import { Severity } from "models/src/IFileCompilationOutput";
import { IParsedFile } from "models/src/IParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";
import { IYamlObjectTypeExtractor } from "./IYamlObjectTypeExtractor";

export default class YamlObjectTypeExtractor implements IYamlObjectTypeExtractor {
  getType(parsedFile: IParsedFile, validatorOutput: ValidatorOutput): ObjectType | undefined {
    const data = parsedFile.data as IYamlObject;

    if (!data || !data.object_type) {
      parsedFile.compilationOutput.push({
        message: "Unknown object type. File will be skipped.",
        severity: Severity.Warning,
      });
      return undefined;
    }

    const allObjectTypes = Object.values(ObjectType).filter((item) => {
      return isNaN(Number(item));
    });
    if (!allObjectTypes.includes(data.object_type as ObjectType)) {
      validatorOutput.file(parsedFile).addError(`Not supported object type ${data.object_type}`);
      return undefined;
    }

    return data.object_type;
  }
}
