import { IValidationOutputContext } from "models/src/IFileCompilationOutput";
import { OutputValidationType } from "models/src/IFileCompilationOutputContext";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlCompositeModel } from "models/src/yaml/IYamlCompositeModel";
import { IYamlDimension, IYamlDimensionLevel } from "models/src/yaml/IYamlDimension";
import { IYamlModel } from "models/src/yaml/IYamlModel";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { getAllModels } from "models/src/yaml/utils/YamlParsedFilesUtil";
import { transformListToReadableString } from "utils/string/string.util";

import { isEqualCaseInsensitive } from "../../utils/compare.util";
import { convertCompositeModel } from "../../utils/composite-model/composite-model.util";
import ValidatorOutput, { FileOutputAppender } from "../../ValidatorOutput/ValidatorOutput";
import { ICompilerValidatorFn } from "../ICompilerValidator";
import IYamlErrorContextUtil from "./YamlObjectReferenceValidators/IYamlErrorContexUtil";
import { IValidateUniqueNamesContext } from "./YamlObjectReferenceValidators/IYamlValidatorUtil";
import YamlValidatorUtil from "./YamlObjectReferenceValidators/YamlValidatorUtil";

export enum YamlDimensionChildType {
  MetricalAttribute = "metrical_attribute",
}

export enum DuplicateObjType {
  LevelAttribute = "level_attribute",
  Level = "level",
  Hierarchy = "hierarchy",
  SecondaryAttribute = "secondary_attribute",
  LevelAlias = "level_alias",
}

interface IYamlModelPerspectiveNames {
  unique_name: string;
  type: string;
  modelFile: IYamlParsedFile<IYamlModel>;
}

const allObjectTypes = { ...ObjectType, ...YamlDimensionChildType } as const;
type ObjectValues<T> = T[keyof T];

type AllObjectTypes = ObjectValues<typeof allObjectTypes>;

export const YamlUniquenessErrors = {
  globalScopeError: (uniqueName: string, path: string, type: string, duplicateType: string) => {
    return `The "${type}" name "${uniqueName}" is not unique. The file "${path}" contains "${duplicateType}" with the same name`;
  },
  fileScopeError: (type: string, duplicateType: string, uniqueName: string) => {
    return `Duplicate ${type} and ${duplicateType} unique names: ${uniqueName}`;
  },
  duplicatePermissionUniqueName: (group: IYamlModelPerspectiveNames[]) => {
    const duplicatedNames = group.map((item) => {
      if (item.type === YamlPerspectiveModelTypes.PERSPECTIVE) {
        return `a perspective unique_name in model ${item.modelFile.data.unique_name}`;
      }

      return `a file unique_name in model ${item.modelFile.data.unique_name}`;
    });
    return `Unique_name "${group[0].unique_name}" is duplicated. It appears as: ${transformListToReadableString(duplicatedNames)};`;
  },
  dimAttributesDuplicateUniqueName: (input: DimensionalAttribute) =>
    `Duplicate unique_names "${input.unique_name}". Hierarchy[${input.hierarchy}] -> ${input.level ? `Level[${input.level}] -> ${input.objectType}` : `Level[${input.unique_name}]`}`,
};

const metricalObjectTypes: Array<AllObjectTypes> = [
  ObjectType.MeasureCalc,
  ObjectType.Measure,
  YamlDimensionChildType.MetricalAttribute,
];

type ValidationItemType = {
  uniqueName: string;
  file: IYamlParsedFile;
  type: AllObjectTypes;
  path: string;
};

export enum YamlPerspectiveModelTypes {
  PERSPECTIVE = "perspective",
  MODEL = "model",
}

export type DimensionalAttribute = {
  unique_name: string;
  objectType: DuplicateObjType;
  hierarchy: string;
  context: IValidationOutputContext;
  level?: string;
};

interface IYamlLevelWithHierarchy extends IYamlDimensionLevel {
  hierarchy: string;
}

const contextErrorMessages = {
  level: "Duplicate level unique name within the same hierarchy",
  levelAttribute: "Duplicate level_attribute unique names",
  duplicateUniqueName: "Duplicate unique names",
};

const bothMetricalOrNoneMetrical = (item1: ValidationItemType, item2: ValidationItemType): boolean => {
  const oneIsMetrical = metricalObjectTypes.includes(item1.type);
  const twoIsMetrical = metricalObjectTypes.includes(item2.type);

  return (oneIsMetrical && twoIsMetrical) || (!oneIsMetrical && !twoIsMetrical);
};

export class YamlUniquenessValidator implements ICompilerValidatorFn {
  private readonly yamlErrorContextUtil: IYamlErrorContextUtil;

  private constructor(YamlErrorContextUtil: IYamlErrorContextUtil) {
    this.yamlErrorContextUtil = YamlErrorContextUtil;
  }

  static create(yamlErrorContextUtil: IYamlErrorContextUtil): YamlUniquenessValidator {
    return new YamlUniquenessValidator(yamlErrorContextUtil);
  }

  validate(yamlParsedFiles: IYamlParsedFile[]): ValidatorOutput {
    const allValidationItems = new Array<ValidationItemType>();

    this.addFiles(yamlParsedFiles, allValidationItems);

    this.addMetricalAttributes(yamlParsedFiles, allValidationItems);

    const validatorOutput = ValidatorOutput.create();

    allValidationItems.forEach((nameAndFile, i) => {
      allValidationItems.forEach((compareTo, y) => {
        if (
          y > i &&
          isEqualCaseInsensitive(nameAndFile.uniqueName, compareTo.uniqueName) &&
          bothMetricalOrNoneMetrical(nameAndFile, compareTo)
        ) {
          //if one of those is metric - all the other should be metrical like
          this.addErrorsInDuplicatedFiles(
            compareTo.uniqueName,
            nameAndFile.file,
            nameAndFile.type,
            compareTo.file,
            compareTo.type,
            validatorOutput
          );
        }
      });
    });

    yamlParsedFiles.forEach((file) => {
      if (file.data.object_type === ObjectType.Dimension) {
        this.validateDimension(file as IYamlParsedFile<IYamlDimension>, validatorOutput);
      }
    });

    this.validateModelPerspectiveUniqueNames(yamlParsedFiles, validatorOutput);

    return validatorOutput;
  }

  groupModelsAndPerspectivesByUniqueName(
    allModels: IYamlParsedFile<IYamlModel | IYamlCompositeModel>[],
    yamlParsedFiles: IYamlParsedFile<IYamlObject>[]
  ) {
    const allModelsAndPerspectives: IYamlModelPerspectiveNames[] = allModels.flatMap((m) => {
      const modelFile = convertCompositeModel(m, yamlParsedFiles) as IYamlParsedFile<IYamlModel>;

      const perspectives: IYamlModelPerspectiveNames[] =
        modelFile.data.perspectives?.map((p) => ({
          unique_name: p.unique_name,
          type: YamlPerspectiveModelTypes.PERSPECTIVE,
          modelFile: modelFile,
        })) || [];

      return [
        { unique_name: modelFile.data.unique_name, type: YamlPerspectiveModelTypes.MODEL, modelFile: modelFile },
        ...perspectives,
      ];
    });

    return YamlValidatorUtil.groupBy(allModelsAndPerspectives, (x) => [x.unique_name]);
  }

  validateModelPerspectiveUniqueNames(
    yamlParsedFiles: IYamlParsedFile<IYamlObject>[],
    validatorOutput: ValidatorOutput,
    getModels: (
      yamlParsedFiles: IYamlParsedFile<IYamlObject>[]
    ) => IYamlParsedFile<IYamlModel | IYamlCompositeModel>[] = getAllModels
  ) {
    const allModels = getModels(yamlParsedFiles);

    const groupedModelAndPerspectivesByUniqueName = this.groupModelsAndPerspectivesByUniqueName(
      allModels,
      yamlParsedFiles
    );

    if (this.hasDuplicateUniqueNames(groupedModelAndPerspectivesByUniqueName)) {
      this.addErrorsForDuplicateModelAndPerspectiveUniqueNames(
        groupedModelAndPerspectivesByUniqueName,
        validatorOutput
      );
    }
  }

  addErrorsForDuplicateModelAndPerspectiveUniqueNames(
    groupedModelAndPerspectivesByUniqueName: Map<string, IYamlModelPerspectiveNames[]>,
    validatorOutput: ValidatorOutput
  ) {
    Array.from(groupedModelAndPerspectivesByUniqueName.values()).forEach((group) => {
      if (group.length > 1) {
        /* If there are multiple items with the same unique_name, we need to check if they have at least one perspective.
        If only models are present in the list, there is a validation for duplicate file unique names which covers the case.
        */
        if (this.hasDuplicatePerspectiveUniqueNames(group)) {
          const uniqueFiles = this.getUniqueFilesWithDuplicateUniqueNames(group);
          uniqueFiles.forEach((item) => {
            validatorOutput.file(item.modelFile).addError(YamlUniquenessErrors.duplicatePermissionUniqueName(group));
          });
        }
      }
    });
  }

  private getUniqueFilesWithDuplicateUniqueNames(
    groupedModelAndPerspectivesByUniqueName: IYamlModelPerspectiveNames[]
  ) {
    return groupedModelAndPerspectivesByUniqueName.filter(
      (obj, index, self) =>
        index === self.findIndex((t) => t.modelFile.data.unique_name === obj.modelFile.data.unique_name)
    );
  }

  private hasDuplicatePerspectiveUniqueNames = (
    groupedModelAndPerspectivesByUniqueName: IYamlModelPerspectiveNames[]
  ) => {
    return groupedModelAndPerspectivesByUniqueName.some((item) => item.type === YamlPerspectiveModelTypes.PERSPECTIVE);
  };

  private hasDuplicateUniqueNames = (
    groupedModelAndPerspectivesByUniqueName: Map<string, IYamlModelPerspectiveNames[]>
  ) => Array.from(groupedModelAndPerspectivesByUniqueName.values()).some((group) => group.length > 1);

  private addMetricalAttributes(
    yamlParsedFiles: IYamlParsedFile<IYamlObject>[],
    allFilesForValidation: ValidationItemType[]
  ) {
    yamlParsedFiles
      .filter((f) => f.data.object_type === ObjectType.Dimension)
      .forEach((file) => {
        const dimension = file.data as IYamlDimension;
        dimension.hierarchies.forEach((h) => {
          h.levels.forEach((level) => {
            if (!level.metrics) {
              return;
            }
            level.metrics.forEach((levelMetric) => {
              allFilesForValidation.push({
                file,
                uniqueName: levelMetric.unique_name,
                type: YamlDimensionChildType.MetricalAttribute,
                path: file.relativePath,
              });
            });
          });
        });
      });
  }

  private addFiles(yamlParsedFiles: IYamlParsedFile<IYamlObject>[], allFilesForValidation: ValidationItemType[]) {
    yamlParsedFiles.forEach((file) => {
      allFilesForValidation.push({
        file: file,
        uniqueName: file.data.unique_name,
        type: file.data.object_type,
        path: file.relativePath,
      });
    });
  }

  private addErrorsInDuplicatedFiles(
    uniqueName: string,
    file: IYamlParsedFile,
    fileType: AllObjectTypes,
    duplicate: IYamlParsedFile,
    duplicateType: AllObjectTypes,
    validatorOutput: ValidatorOutput
  ): void {
    if (file.relativePath === duplicate.relativePath) {
      validatorOutput.file(file).addError(YamlUniquenessErrors.fileScopeError(fileType, duplicateType, uniqueName));
      return;
    }

    validatorOutput
      .file(file)
      .addError(YamlUniquenessErrors.globalScopeError(uniqueName, duplicate.relativePath, fileType, duplicateType));

    validatorOutput
      .file(duplicate)
      .addError(YamlUniquenessErrors.globalScopeError(uniqueName, file.relativePath, duplicateType, fileType));
  }

  private validateDimension(file: IYamlParsedFile<IYamlDimension>, validatorOutput: ValidatorOutput) {
    const dimension = file.data;

    this.validateUniqueNames(
      dimension.level_attributes.map((l) => l.unique_name),
      DuplicateObjType.LevelAttribute,
      validatorOutput.file(file),
      { getContext: this.getLevelAttributeContext }
    );

    this.validateUniqueNames(
      dimension.hierarchies.map((h) => h.unique_name),
      DuplicateObjType.Hierarchy,
      validatorOutput.file(file)
    );

    dimension.hierarchies.forEach((hierarchy) => {
      const levelUniqueNames = hierarchy.levels.map((l) => l.unique_name);
      this.validateUniqueNames(levelUniqueNames, DuplicateObjType.Level, validatorOutput.file(file), {
        getContext: this.getLevelContext,
        hierarchyUniqueName: hierarchy.unique_name,
      });
    });

    this.validateDimensionalAttributes(file, validatorOutput);
  }

  private validateUniqueNames(
    uniqueNames: Array<string>,
    duplicateObjType: string,
    fileAppender: FileOutputAppender,
    context?: IValidateUniqueNamesContext
  ) {
    const itemsGrouped = this.groupUniqueNames(uniqueNames);
    if (context) {
      YamlValidatorUtil.appendErrorsWithContextIfDuplicates(
        itemsGrouped,
        fileAppender,
        this.getErrorMessage(duplicateObjType, context?.hierarchyUniqueName),
        context
      );
    } else {
      YamlValidatorUtil.appendErrorsIfDuplicates(itemsGrouped, fileAppender, this.getErrorMessage(duplicateObjType));
    }
  }

  getErrorMessage(
    duplicateObjType: string,
    hierarchyUniqueName?: string
  ): (uniqueName: string, itemCount: number) => string {
    const getError = (uniqueName: string, itemCount: number) =>
      hierarchyUniqueName
        ? `Duplicate ${duplicateObjType} unique_names "${uniqueName}" within hierarchy "${hierarchyUniqueName}". ${itemCount} duplicate items found.`
        : `Duplicate ${duplicateObjType} unique_names "${uniqueName}". ${itemCount} duplicate items found.`;

    return getError;
  }

  groupUniqueNames(uniqueNames: Array<string>): Map<string, string[]> {
    return YamlValidatorUtil.groupBy(uniqueNames, (n) => [n]);
  }

  getLevelContext = (itemUniqueName: string, hierarchyUniqueName?: string): IValidationOutputContext => {
    return this.yamlErrorContextUtil.getLevelContext({
      itemUniqueName,
      message: contextErrorMessages.level,
      validationType: OutputValidationType.uniqueName,
      hierarchyUniqueName: hierarchyUniqueName || "",
    });
  };

  getLevelAttributeContext = (itemUniqueName: string): IValidationOutputContext => {
    return this.yamlErrorContextUtil.getLevelAttributeContext({
      itemUniqueName: itemUniqueName,
      message: contextErrorMessages.levelAttribute,
      validationType: OutputValidationType.uniqueName,
    });
  };

  getSecondaryAttributeContext = (itemUniqueName: string): IValidationOutputContext => {
    return this.yamlErrorContextUtil.getSecondaryAttributeContext({
      itemUniqueName: itemUniqueName,
      message: contextErrorMessages.duplicateUniqueName,
      validationType: OutputValidationType.uniqueName,
    });
  };

  validateDimensionalAttributes(file: IYamlParsedFile<IYamlDimension>, validatorOutput: ValidatorOutput): void {
    const allAttributesGrouped = YamlValidatorUtil.groupBy(this.getAllDimensionalAttributes(file.data), (x) => [
      x.unique_name,
    ]);
    YamlValidatorUtil.processDuplicates(allAttributesGrouped, (attributeGroup) => {
      attributeGroup.forEach((attribute) => {
        validatorOutput
          .file(file)
          .addErrorWithContext(YamlUniquenessErrors.dimAttributesDuplicateUniqueName(attribute), attribute.context);
      });
    });
  }

  getAllDimensionalAttributes(dimension: IYamlDimension): DimensionalAttribute[] {
    const allLevelsWithHierarchyName = dimension.hierarchies.flatMap((h) =>
      h.levels.map((l): IYamlLevelWithHierarchy => ({ ...l, hierarchy: h.unique_name }))
    );

    const childLevelAtrributes = allLevelsWithHierarchyName.flatMap((l) => {
      const secondaryAttributes =
        l.secondary_attributes?.map(
          (sa): DimensionalAttribute => ({
            unique_name: sa.unique_name,
            hierarchy: l.hierarchy,
            objectType: DuplicateObjType.SecondaryAttribute,
            level: l.unique_name,
            context: this.getSecondaryAttributeContext(sa.unique_name),
          })
        ) || [];
      const levelAliases =
        l.aliases?.map(
          (alias): DimensionalAttribute => ({
            unique_name: alias.unique_name,
            hierarchy: l.hierarchy,
            objectType: DuplicateObjType.LevelAlias,
            level: l.unique_name,
            context: this.yamlErrorContextUtil.getLevelAliasContext({
              itemUniqueName: alias.unique_name,
              message: contextErrorMessages.duplicateUniqueName,
              validationType: OutputValidationType.uniqueName,
            }),
          })
        ) || [];

      return secondaryAttributes.concat(levelAliases);
    });

    return [...this.getUniqueLevelsInDimension(allLevelsWithHierarchyName), ...childLevelAtrributes];
  }

  private getUniqueLevelsInDimension(levels: IYamlLevelWithHierarchy[]): DimensionalAttribute[] {
    const allLevelsMap = YamlValidatorUtil.groupBy(levels, (x) => [x.unique_name]);
    return Array.from(allLevelsMap.values())
      .flatMap((x) => x[0])
      .map((l) => ({
        unique_name: l.unique_name,
        hierarchy: l.hierarchy,
        objectType: DuplicateObjType.Level,
        context: this.yamlErrorContextUtil.getLevelContext({
          itemUniqueName: l.unique_name,
          message: contextErrorMessages.duplicateUniqueName,
          validationType: OutputValidationType.uniqueName,
          hierarchyUniqueName: l.hierarchy,
        }),
      }));
  }
}
