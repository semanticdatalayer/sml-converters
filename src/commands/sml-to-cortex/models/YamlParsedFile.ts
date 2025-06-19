import { SMLObject } from "sml-sdk";
import { IParsedFile } from "./IParsedFile";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export default interface YamlParsedFile<T extends SMLObject = SMLObject> extends IParsedFile<T> {}
