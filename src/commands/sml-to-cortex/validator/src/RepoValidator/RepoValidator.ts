import { IFile } from "models/src/IFile";
import { IFolderStructure } from "models/src/IFolderStructure";
import { IYamlFile } from "models/src/IYamlFile";

import { CompilerValidator } from "../CompilerValidator/CompilerValidator";
import { ICompilerValidator } from "../CompilerValidator/ICompilerValidator";
import { YamlGlobalCalculationGroupValidator } from "../CompilerValidator/Validators/GlobalValidators/YamlGlobalCalculationGroupValidator";
import { YamlGlobalConnectionsValidator } from "../CompilerValidator/Validators/GlobalValidators/YamlGlobalConnectionsValidator";
import { YamlGlobalDimensionsValidator } from "../CompilerValidator/Validators/GlobalValidators/YamlGlobalDimensionsValidator/YamlGlobalDimensionsValidator";
import { YamlGlobalFolderStructureValidator } from "../CompilerValidator/Validators/GlobalValidators/YamlGlobalFolderStructureValidator";
import { YamlGlobalModelsValidator } from "../CompilerValidator/Validators/GlobalValidators/YamlGlobalModelsValidator/YamlGlobalModelsValidator";
import { YamlGlobalSettingsValidator } from "../CompilerValidator/Validators/GlobalValidators/YamlGlobalSettingsValidator";
import { SubmoduleValidator } from "../CompilerValidator/Validators/GlobalValidators/YamlPackageFileValidator/SubModuleValidator";
import { YamlPackageFileValidator } from "../CompilerValidator/Validators/GlobalValidators/YamlPackageFileValidator/YamlPackageFileValidator";
import { IYamlDegenerateDimensionUtil } from "../CompilerValidator/Validators/Utils/IYamlDegenerateDimensionUtil";
import YamlDegenerateDimensionUtil from "../CompilerValidator/Validators/Utils/YamlDegenerateDimensionUtil";
import IYamlErrorContextUtil from "../CompilerValidator/Validators/YamlObjectReferenceValidators/IYamlErrorContexUtil";
import YamlErrorContextUtil from "../CompilerValidator/Validators/YamlObjectReferenceValidators/YamlErrorContextUtil";
import { YamlObjectsValidator } from "../CompilerValidator/Validators/YamlObjectsValidator";
import { YamlUniquenessValidator } from "../CompilerValidator/Validators/YamlUniquenessValidator";
import { IRepoParser } from "../RepoParser/IRepoParser";
import { RepoParser } from "../RepoParser/RepoParser";
import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";
import YamlObjectSchemaValidator from "../YamlObjectSchemaValidator/YamlObjectSchemaValidator";
import { IYamlObjectTypeExtractor } from "../YamlObjectTypeExtractor/IYamlObjectTypeExtractor";
import YamlObjectTypeExtractor from "../YamlObjectTypeExtractor/YamlObjectTypeExtractor";
import { IRepoValidator, IRepoValidatorResult } from "./IRepoValidator";

type RepoValidatorDependencies = {
  yamlObjectTypeExtractor: IYamlObjectTypeExtractor;
  objectValidator: ICompilerValidator;
  repoParser: IRepoParser;
  yamlErrorContextUtil: IYamlErrorContextUtil;
  yamlDegenerateDimensionUtil: IYamlDegenerateDimensionUtil;
};

export default class RepoValidator implements IRepoValidator {
  dependencies: RepoValidatorDependencies;

  constructor(deps: Partial<RepoValidatorDependencies> = {}) {
    const defaultDep: RepoValidatorDependencies = {
      yamlObjectTypeExtractor: new YamlObjectTypeExtractor(),
      objectValidator: new CompilerValidator(),
      repoParser: new RepoParser(),
      yamlErrorContextUtil: new YamlErrorContextUtil(),
      yamlDegenerateDimensionUtil: new YamlDegenerateDimensionUtil(),
    };

    this.dependencies = Object.assign(defaultDep, deps);
  }

  validateRepo(rootFolder: IFolderStructure<IFile>, isGlobalSettingsRepo: boolean): IRepoValidatorResult {
    const validatorOutput = new ValidatorOutput();
    const parsedRootFolder = this.dependencies.repoParser.parseFolderStructure(rootFolder, validatorOutput);

    let yamlParsedFiles = this.dependencies.repoParser.extractYamlFiles(parsedRootFolder, validatorOutput);
    yamlParsedFiles = this.dependencies.repoParser.getYamlFilesWithValidObjectType(yamlParsedFiles, validatorOutput);

    validatorOutput.append(this.validateYamlFiles(yamlParsedFiles, parsedRootFolder, isGlobalSettingsRepo));

    return { filesOutput: validatorOutput.filesOutput, globalOutput: validatorOutput.globalOutput };
  }

  validateYamlFiles(
    yamlFiles: Array<IYamlFile>,
    rootFolder: IFolderStructure<IFile>,
    isGlobalSettingsRepo = false
  ): IRepoValidatorResult {
    const objectValidator = this.dependencies.objectValidator.addValidator(
      YamlGlobalSettingsValidator.create(isGlobalSettingsRepo)
    );

    if (!isGlobalSettingsRepo) {
      objectValidator
        .addValidator(SubmoduleValidator.create())
        .addRequiredValidator(YamlObjectSchemaValidator.create())
        .addRequiredValidator(YamlPackageFileValidator.create())
        .addRequiredValidator(YamlUniquenessValidator.create(this.dependencies.yamlErrorContextUtil))
        .addValidator(YamlGlobalConnectionsValidator.create())
        .addValidator(YamlGlobalFolderStructureValidator.create())
        .addValidator(YamlObjectsValidator.create())
        .addValidator(YamlGlobalCalculationGroupValidator.create())
        .addValidator(YamlGlobalModelsValidator.create(this.dependencies.yamlDegenerateDimensionUtil))
        .addValidator(YamlGlobalDimensionsValidator.create(this.dependencies.yamlDegenerateDimensionUtil));
    }

    return objectValidator.validate(yamlFiles, rootFolder);
  }

  //copied
  getYamlFilesWithValidObjectType(parsedFiles: Array<IYamlFile>, validatorOutput: ValidatorOutput): Array<IYamlFile> {
    const yamlParsedFiles: Array<IYamlFile> = [];
    parsedFiles.forEach((yamlFile) => {
      const type = this.dependencies.yamlObjectTypeExtractor.getType(yamlFile, validatorOutput);
      if (type) {
        yamlParsedFiles.push(yamlFile);
      }
    });

    return yamlParsedFiles;
  }
}
