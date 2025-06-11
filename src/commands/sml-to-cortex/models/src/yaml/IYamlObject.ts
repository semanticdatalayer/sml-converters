import { ObjectType } from "../ObjectType";

export interface IYamlObject extends IReferenceableYamlObject {
  object_type: ObjectType;
}

//TODO: refactor this to IReferenceableObjectWithLabel
export interface IReferenceableYamlObject extends IUniqueNameObject {
  label: string;
}

//TODO: refactor this to IReferenceableObject
export interface IUniqueNameObject {
  unique_name: string;
}
