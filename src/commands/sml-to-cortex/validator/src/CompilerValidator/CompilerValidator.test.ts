import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import { IFile } from "models/src/IFile";
import { Severity } from "models/src/IFileCompilationOutput";
import { IFolderStructure } from "models/src/IFolderStructure";

import ValidatorOutput from "../ValidatorOutput/ValidatorOutput";
import { CompilerValidator } from "./CompilerValidator";
import { ICompilerValidator, ICompilerValidatorFn } from "./ICompilerValidator";

let yamlObjectValidator: ICompilerValidator;

const getValidator = (validatorName: string, severity: Severity): ICompilerValidatorFn => ({
  validate: jest.fn((files: Array<IFile>) => {
    const validatorOutput = ValidatorOutput.create();
    files.forEach((f) => validatorOutput.file(f).add(severity, `Validator ${validatorName} is not happy`));
    return validatorOutput;
  }),
});

const emptyRootFolder = {} as IFolderStructure<IFile>;

const yamlFiles = [YamlModelBuilder.create().buildYamlFile()];

describe("YamlObjectValidator", () => {
  beforeEach(() => {
    yamlObjectValidator = new CompilerValidator();
  });

  it("should call all validators validate methods", () => {
    const validator1 = getValidator("validator1", Severity.Warning);
    const validator2 = getValidator("validator2", Severity.Warning);
    yamlObjectValidator.addValidator(validator1).addValidator(validator2).validate(yamlFiles, emptyRootFolder);

    expect(validator1.validate).toHaveBeenCalled();
    expect(validator2.validate).toHaveBeenCalled();
  });

  it("should call all validators validate methods even it they add errors", () => {
    const validator1 = getValidator("validator1", Severity.Error);
    const validator2 = getValidator("validator2", Severity.Error);
    yamlObjectValidator.addValidator(validator1).addValidator(validator2).validate(yamlFiles, emptyRootFolder);

    expect(validator1.validate).toHaveBeenCalled();
    expect(validator2.validate).toHaveBeenCalled();
  });

  it("Should stop validation on the requiredValidator is it adds errors", () => {
    const validator1 = getValidator("validator1", Severity.Warning);
    const validator2 = getValidator("validator2", Severity.Error);
    const validator3 = getValidator("validator3", Severity.Error);

    yamlObjectValidator
      .addValidator(validator1)
      .addRequiredValidator(validator2)
      .addValidator(validator3)
      .validate(yamlFiles, emptyRootFolder);

    expect(validator1.validate).toHaveBeenCalled();
    expect(validator2.validate).toHaveBeenCalled();
    expect(validator3.validate).not.toHaveBeenCalled();
  });

  it("Should not stop validation on the requiredValidator is it adds warnigns only", () => {
    const validator1 = getValidator("validator1", Severity.Warning);
    const validator2 = getValidator("validator2", Severity.Warning);
    const validator3 = getValidator("validator3", Severity.Error);

    yamlObjectValidator
      .addValidator(validator1)
      .addRequiredValidator(validator2)
      .addValidator(validator3)
      .validate(yamlFiles, emptyRootFolder);

    expect(validator1.validate).toHaveBeenCalled();
    expect(validator2.validate).toHaveBeenCalled();
    expect(validator3.validate).toHaveBeenCalled();
  });

  it("When addValidatorIfNoErrorsSoFar should invoke validator, if no errors so far", () => {
    const validator1 = getValidator("validator1", Severity.Warning);
    const validator2 = getValidator("validator2", Severity.Warning);
    const validator3 = getValidator("validator3", Severity.Error);

    yamlObjectValidator
      .addValidator(validator1)
      .addValidator(validator2)
      .addValidatorIfNoErrorsSoFar(validator3)
      .validate(yamlFiles, emptyRootFolder);

    expect(validator1.validate).toHaveBeenCalled();
    expect(validator2.validate).toHaveBeenCalled();
    expect(validator3.validate).toHaveBeenCalled();
  });

  it("When addValidatorIfNoErrorsSoFar should NOT invoke validator, if errors so far", () => {
    const validator1 = getValidator("validator1", Severity.Error);
    const validator2 = getValidator("validator2", Severity.Warning);
    const validator3 = getValidator("validator3", Severity.Warning);

    yamlObjectValidator
      .addValidator(validator1)
      .addValidator(validator2)
      .addValidatorIfNoErrorsSoFar(validator3)
      .validate(yamlFiles, emptyRootFolder);

    expect(validator1.validate).toHaveBeenCalled();
    expect(validator2.validate).toHaveBeenCalled();
    expect(validator3.validate).not.toHaveBeenCalled();
  });
});
