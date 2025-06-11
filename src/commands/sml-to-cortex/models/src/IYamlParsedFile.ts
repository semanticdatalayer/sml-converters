import { IParsedFile } from "./IParsedFile";
import { IYamlObject } from "./yaml/IYamlObject";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export default interface IYamlParsedFile<T extends IYamlObject = IYamlObject> extends IParsedFile<T> {}
