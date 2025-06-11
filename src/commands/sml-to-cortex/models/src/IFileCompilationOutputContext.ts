export enum OutputCompilationType {
  Level = "level",
  SecondaryAttribute = "secondary-attribute",
  LevelAttribute = "level-attribute",
  LevelAlias = "level-alias",
}

export enum OutputValidationType {
  uniqueName = "unique_name",
  customEmptyMember = "custom_empty_member",
  timeUnit = "time_unit",
  notExistingLevelReference = "not_existing_level_reference",
  invalidTimeUnitLevelOrder = "invalid_time_unit_order",
  column_unique = "column_unique",
  attribute_key_name = "attribute_key_name",
  level_secondary_attribute_key = "level_secondary_attribute_key",
}

export interface ICompilationOutputContext {
  type: OutputCompilationType;
  message: string;
  validationType: OutputValidationType;
}

export interface ILevelAttributeValidationOutputContext extends ICompilationOutputContext {
  type: OutputCompilationType.LevelAttribute;
  levelAttribute: string;
}

export interface ISecondaryAttributeValidationOutputContext extends ICompilationOutputContext {
  type: OutputCompilationType.SecondaryAttribute;
  secondaryAttribute: string;
}

export interface ILevelAliasValidationOutputContext extends ICompilationOutputContext {
  type: OutputCompilationType.LevelAlias;
  levelAlias: string;
}

export interface ILevelValidationOutputContext extends ICompilationOutputContext {
  type: OutputCompilationType.Level;
  level: string;
  hierarchy: string;
}
