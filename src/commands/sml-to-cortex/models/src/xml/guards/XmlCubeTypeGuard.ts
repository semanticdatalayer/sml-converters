import { IXmlCube } from "../IXmlCube";
import IXmlProject from "../IXmlProject";

const XmlCubeTypeGuard = {
  isCube(input: IXmlProject | IXmlCube): input is IXmlCube {
    return Object.getOwnPropertyNames(input).includes("id");
  },
};

export default XmlCubeTypeGuard;
