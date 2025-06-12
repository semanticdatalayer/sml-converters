import { FILE_TYPE } from "../FileType";
import { IFile } from "../IFile";
import IRawFile from "../IRawFile";
import { IYamlFile } from "../IYamlFile";
import TypeGuardUtil from "../yaml/guards/type-guard-util";
import {
  SMLCompositeModel,
  SMLDimension,
  SMLModel,
  SMLObject,
  SMLPackageFile
} from 'sml-sdk';

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

  isPackageFile(input: unknown): input is SMLPackageFile {
    return TypeGuardUtil.hasProps<SMLPackageFile>(input, "version", "packages");
  },

  isFileDimensionType(obj: IYamlFile<SMLObject>): obj is IYamlFile<SMLDimension> {
    return obj.type === FILE_TYPE.Dimension;
  },

  isFileModelType(obj: IYamlFile<SMLObject>): obj is IYamlFile<SMLModel> {
    return obj.type === FILE_TYPE.Model;
  },

  isFileCompositeModelType(obj: IYamlFile<SMLObject>): obj is IYamlFile<SMLCompositeModel> {
    return obj.type === FILE_TYPE.CompositeModel;
  },

  isEnvFile(input: IFile): boolean {
    return input.type === FILE_TYPE.Environment;
  },
};

export default FileTypeGuard;
