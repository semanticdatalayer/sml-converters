import { SMLObject } from "sml-sdk";
import { IParsedFile } from "./IParsedFile";
// import { IYamlObject } from "./yaml/IYamlObject";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export default interface IYamlParsedFile<T extends SMLObject = SMLObject> extends IParsedFile<T> {}
