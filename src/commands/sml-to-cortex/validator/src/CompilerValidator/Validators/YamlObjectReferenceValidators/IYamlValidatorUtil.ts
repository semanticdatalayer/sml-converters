import { IValidationOutputContext } from "models/src/IFileCompilationOutput";

export interface IValidateUniqueNamesContext {
  getContext: (itemUniqueName: string, hierarchyUniqueName?: string) => IValidationOutputContext;
  hierarchyUniqueName?: string;
}
