import { CalculationMembersTemplatesIds } from "./CalculationMemberTemplates";
import { IFormatting } from "./ISharedProps";
import { IReferenceableYamlObject, IUniqueNameObject } from "./IYamlObject";

export interface IYamlDimensionCalculationMember extends IUniqueNameObject, IYamlDimensionCalculationMemberFormatting {
  expression?: string;
  template?: CalculationMembersTemplatesIds;
  description?: string;
}

interface IYamlDimensionCalculationMemberFormatting extends IFormatting {
  use_input_metric_format?: boolean;
}

export interface IYamlDimensionCalculationGroup extends IReferenceableYamlObject {
  calculated_members: Array<IYamlDimensionCalculationMember>;
  description?: string;
  folder?: string;
}
