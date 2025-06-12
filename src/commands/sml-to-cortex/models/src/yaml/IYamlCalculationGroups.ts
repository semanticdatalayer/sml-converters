import {
  SMLReferenceableObject,
  SMLReferenceableObjectWithLabel,
} from "sml-sdk";

import { CalculationMembersTemplatesIds } from "./CalculationMemberTemplates";
import { IFormatting } from "./ISharedProps";
// import { IReferenceableYamlObject, IUniqueNameObject } from "./IYamlObject";

export interface IYamlDimensionCalculationMember extends SMLReferenceableObject, IYamlDimensionCalculationMemberFormatting {
  expression?: string;
  template?: CalculationMembersTemplatesIds;
  description?: string;
}

interface IYamlDimensionCalculationMemberFormatting extends IFormatting {
  use_input_metric_format?: boolean;
}

export interface IYamlDimensionCalculationGroup extends SMLReferenceableObjectWithLabel {
  calculated_members: Array<IYamlDimensionCalculationMember>;
  description?: string;
  folder?: string;
}
