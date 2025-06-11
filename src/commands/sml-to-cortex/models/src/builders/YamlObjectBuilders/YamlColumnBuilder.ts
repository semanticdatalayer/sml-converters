import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import {
  IYamlDatasetColumn,
  IYamlDatasetColumnDerived,
  IYamlDatasetColumnMap,
  IYamlDatasetColumnMapDefinition,
  IYamlDatasetColumnSimple,
  YamlColumnDataType,
} from "../../yaml/IYamlDataset";

class YamlDatasetColumnSimpleBuilder extends AnyObjectBuilder<IYamlDatasetColumnSimple> implements IYamlColumnBuilder {
  static create(data: Partial<IYamlDatasetColumnSimple> = {}): YamlDatasetColumnSimpleBuilder {
    const defaultData: IYamlDatasetColumnSimple = {
      data_type: YamlColumnDataType.String,
      name: "name not set",
    };
    return new YamlDatasetColumnSimpleBuilder(Object.assign(defaultData, data));
  }
  with(data: Partial<IYamlDatasetColumnSimple>): YamlDatasetColumnSimpleBuilder {
    return super.with(data) as YamlDatasetColumnSimpleBuilder;
  }
  withDataType(data_type: YamlColumnDataType) {
    return this.with({ data_type });
  }
}

class YamlDatasetColumnMapBuilder extends AnyObjectBuilder<IYamlDatasetColumnMap> implements IYamlColumnBuilder {
  static create(data: Partial<IYamlDatasetColumnMap> = {}): YamlDatasetColumnMapBuilder {
    const defaultData: IYamlDatasetColumnMap = {
      name: "name not set",
      map: {
        field_terminator: ";",
        key_terminator: ",",
        key_type: "string",
        value_type: "string",
      },
    };
    return new YamlDatasetColumnMapBuilder(Object.assign(defaultData, data));
  }

  with(data: Partial<IYamlDatasetColumnMap>): YamlDatasetColumnMapBuilder {
    return super.with(data) as YamlDatasetColumnMapBuilder;
  }

  withMapDefinition(data: IYamlDatasetColumnMapDefinition): YamlDatasetColumnMapBuilder {
    return this.with({ map: data });
  }
}

class YamlDatasetColumnDerivedBuilder
  extends AnyObjectBuilder<IYamlDatasetColumnDerived>
  implements IYamlColumnBuilder
{
  static create(data: Partial<IYamlDatasetColumnDerived> = {}): YamlDatasetColumnDerivedBuilder {
    const defaultData: IYamlDatasetColumnDerived = {
      data_type: YamlColumnDataType.String,
      name: "name not set",
      parent_column: "parent column not set",
    };
    return new YamlDatasetColumnDerivedBuilder(Object.assign(defaultData, data));
  }
  with(data: Partial<IYamlDatasetColumnDerived>): YamlDatasetColumnDerivedBuilder {
    return super.with(data) as YamlDatasetColumnDerivedBuilder;
  }
}

export interface IYamlColumnBuilder {
  build: () => IYamlDatasetColumn;
}

export default class YamlDatasetColumnBuilder {
  static simple(data: Partial<IYamlDatasetColumnSimple> = {}): YamlDatasetColumnSimpleBuilder {
    return YamlDatasetColumnSimpleBuilder.create(data);
  }

  static mapColumn(data: Partial<IYamlDatasetColumnMap> = {}): YamlDatasetColumnMapBuilder {
    return YamlDatasetColumnMapBuilder.create(data);
  }

  static derivedColumn(data: Partial<IYamlDatasetColumnDerived> = {}): YamlDatasetColumnDerivedBuilder {
    return YamlDatasetColumnDerivedBuilder.create(data);
  }
}
