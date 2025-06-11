import { Severity } from "models/src/IFileCompilationOutput";

import ValidatorOutput from "./ValidatorOutput";

describe("ValidatorOutput", () => {
  describe("addFileOutputRaw", () => {
    const fileName1 = "file1";
    const fileName2 = "file2";

    const warningOutput = {
      message: "message",
      severity: Severity.Warning,
    };

    const errorOutput = {
      message: "message",
      severity: Severity.Error,
    };

    it("should add a file output", () => {
      const validatorOutput = ValidatorOutput.create();

      validatorOutput.addFileOutputRaw(fileName1, warningOutput);

      const fileOutput = validatorOutput.getFileOutput(fileName1);

      expect(fileOutput?.length).toBe(1);

      expect(fileOutput?.[0].severity).toBe(warningOutput.severity);
      expect(fileOutput?.[0].message).toBe(warningOutput.message);
    });

    it("should add file outputs with the same messages, but with different severity", () => {
      const validatorOutput = ValidatorOutput.create();

      validatorOutput.addFileOutputRaw(fileName1, warningOutput);
      validatorOutput.addFileOutputRaw(fileName1, errorOutput);

      const fileOutput = validatorOutput.getFileOutput(fileName1);

      expect(fileOutput?.length).toBe(2);

      expect(fileOutput?.[0].severity).toBe(warningOutput.severity);
      expect(fileOutput?.[0].message).toBe(warningOutput.message);

      expect(fileOutput?.[1].severity).toBe(errorOutput.severity);
      expect(fileOutput?.[1].message).toBe(errorOutput.message);
    });

    it("should add file outputs with the same severity, but with different messages", () => {
      const validatorOutput = ValidatorOutput.create();

      const secondWarningOutput = {
        ...warningOutput,
        message: "another message",
      };

      validatorOutput.addFileOutputRaw(fileName1, warningOutput);
      validatorOutput.addFileOutputRaw(fileName1, secondWarningOutput);

      const fileOutput = validatorOutput.getFileOutput(fileName1);

      expect(fileOutput?.length).toBe(2);

      expect(fileOutput?.[0].severity).toBe(warningOutput.severity);
      expect(fileOutput?.[0].message).toBe(warningOutput.message);

      expect(fileOutput?.[1].severity).toBe(warningOutput.severity);
      expect(fileOutput?.[1].message).toBe(secondWarningOutput.message);
    });

    it("should add file outputs with the same severity and message to another file", () => {
      const validatorOutput = ValidatorOutput.create();

      validatorOutput.addFileOutputRaw(fileName1, warningOutput);
      validatorOutput.addFileOutputRaw(fileName2, warningOutput);

      const file1Output = validatorOutput.getFileOutput(fileName1);
      const file2Output = validatorOutput.getFileOutput(fileName2);

      expect(file1Output?.length).toBe(1);
      expect(file2Output?.length).toBe(1);

      expect(file1Output?.[0].severity).toBe(warningOutput.severity);
      expect(file1Output?.[0].message).toBe(warningOutput.message);

      expect(file2Output?.[0].severity).toBe(warningOutput.severity);
      expect(file2Output?.[0].message).toBe(warningOutput.message);
    });

    it("should not add file outputs with the same severity and message", () => {
      const validatorOutput = ValidatorOutput.create();

      validatorOutput.addFileOutputRaw(fileName1, warningOutput);
      validatorOutput.addFileOutputRaw(fileName1, warningOutput);

      const fileOutput = validatorOutput.getFileOutput(fileName1);

      expect(fileOutput?.length).toBe(1);

      expect(fileOutput?.[0].severity).toBe(warningOutput.severity);
      expect(fileOutput?.[0].message).toBe(warningOutput.message);
    });
  });
});
