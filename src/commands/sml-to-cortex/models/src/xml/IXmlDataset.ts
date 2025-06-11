import { IXmlDatasetLogical } from "./IXmlDatasetLogical";
import { IXmlDatasetPhysical } from "./IXmlDatasetPhysical";
import { IXmlAttributesLists } from "./IXmlProject";

export interface IXmlDatasetProperties {
  allowAggregates: boolean;
  invariant?: string;
  aggregateLocality?: {
    managed?: string;
    collocated?: string;
  };
  aggregateDestinations?: Partial<AggregateDestinations>;
}

export interface AggregateDestinations {
  allowLocal?: boolean;
  allowPeer?: boolean;
  allowPreferred?: boolean;
}

export interface IXMLCubeDatasetProperties {
  allowAggregates?: boolean;
  createHintedAggregate?: boolean;
  aggregateDestinations?: AggregateDestinations;
}

export interface IXmlDataSetRef {
  id: string;
  //TODO: How we can set properties from AML?
  properties?: IXMLCubeDatasetProperties;
  logical?: IXmlDatasetLogical;
  yamlUniqueName?: string;
}

export interface IXmlDataset {
  id: string;
  name: string;
  properties: IXmlDatasetProperties;
  physical: IXmlDatasetPhysical;
  logical?: IXmlDatasetLogical;
  attributes?: IXmlAttributesLists;
  schema?: string;
}
