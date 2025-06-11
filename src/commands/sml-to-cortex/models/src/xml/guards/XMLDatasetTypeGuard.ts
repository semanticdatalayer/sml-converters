import { IXmlDataset, IXmlDataSetRef } from "../IXmlDataset";

const XmlDatasetOrRef = {
  isIXmlDataset(input: IXmlDataset | IXmlDataSetRef): input is IXmlDataset {
    return Object.getOwnPropertyNames(input).includes("name");
  },
};

export default XmlDatasetOrRef;
