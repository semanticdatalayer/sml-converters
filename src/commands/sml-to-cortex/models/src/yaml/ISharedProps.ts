export interface ICommonAttributeProps {
  description?: string;
  //TODO check in measures
  is_hidden?: boolean;
  folder?: string;
}

//TODO ask again for format string. How to match enum?
export interface IFormatting {
  format?: string;
}

export interface IAttributeData {
  dataset: string;
}

export enum AttributeRole {
  Security = "security",
}

export interface IAttributeRole {
  role?: AttributeRole;
}
