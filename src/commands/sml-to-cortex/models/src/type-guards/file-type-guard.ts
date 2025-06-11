import { FILE_TYPE } from "../FileType";
import { IFile } from "../IFile";
import IRawFile from "../IRawFile";
import { IYamlFile } from "../IYamlFile";
import TypeGuardUtil from "../yaml/guards/type-guard-util";
import { IYamlCompositeModel } from "../yaml/IYamlCompositeModel";
import { IYamlDimension } from "../yaml/IYamlDimension";
import { IYamlModel } from "../yaml/IYamlModel";
import { IYamlObject } from "../yaml/IYamlObject";
import { IYamlPackageFile } from "../yaml/IYamlPackageFile";

const FileTypeGuard = {
  isYamlFile(input: IFile): input is IYamlFile {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const probablyYamlFile = input as any as IYamlFile;
    return probablyYamlFile.data !== undefined && probablyYamlFile.data.object_type !== undefined;
  },

  isTextFile(input: IFile): boolean {
    return input.type === FILE_TYPE.Text;
  },

  isRawFile(input: unknown): input is IRawFile {
    return TypeGuardUtil.hasProps<IRawFile>(input, "rawContent", "relativePath");
  },

  isPackageFile(input: unknown): input is IYamlPackageFile {
    return TypeGuardUtil.hasProps<IYamlPackageFile>(input, "version", "packages");
  },

  isFileDimensionType(obj: IYamlFile<IYamlObject>): obj is IYamlFile<IYamlDimension> {
    return obj.type === FILE_TYPE.Dimension;
  },

  isFileModelType(obj: IYamlFile<IYamlObject>): obj is IYamlFile<IYamlModel> {
    return obj.type === FILE_TYPE.Model;
  },

  isFileCompositeModelType(obj: IYamlFile<IYamlObject>): obj is IYamlFile<IYamlCompositeModel> {
    return obj.type === FILE_TYPE.CompositeModel;
  },

  isEnvFile(input: IFile): boolean {
    return input.type === FILE_TYPE.Environment;
  },
};

export default FileTypeGuard;
