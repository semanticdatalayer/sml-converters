import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlConnection } from "models/src/yaml/IYamlConnection";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import { IYamlObjectValidator } from "../../IYamlObjectValidator";

export class YamlConnectionValidator implements IYamlObjectValidator {
  validateObject(item: IYamlParsedFile, elementsMap: Map<string, IYamlParsedFile>): ValidatorOutput {
    const connection = item.data as IYamlConnection;

    const validatorOutput = ValidatorOutput.create();
    elementsMap.forEach((element) => {
      const elementData = element.data as IYamlConnection;
      if (connection.unique_name === elementData.unique_name) {
        return;
      }

      if (elementData.object_type !== ObjectType.Connection) {
        return;
      }

      if (
        connection.as_connection === elementData.as_connection &&
        connection.database === elementData.database &&
        connection.schema === elementData.schema
      ) {
        validatorOutput
          .file(item)
          .addWarning(`Connection "${connection.unique_name}" is duplicated with file ${element.relativePath}`);
      }
    });
    return validatorOutput;
  }
}
