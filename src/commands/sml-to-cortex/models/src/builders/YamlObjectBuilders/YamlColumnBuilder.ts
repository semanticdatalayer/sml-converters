import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import {
  SMLDatasetColumn,
  SMLDatasetColumnDerived,
  SMLDatasetColumnMap,
  SMLDatasetColumnMapDefinition,
  SMLDatasetColumnSimple,
  SMLColumnDataType,
} from "sml-sdk";

class YamlDatasetColumnSimpleBuilder extends AnyObjectBuilder<SMLDatasetColumnSimple> implements IYamlColumnBuilder {
  static create(data: Partial<SMLDatasetColumnSimple> = {}): YamlDatasetColumnSimpleBuilder {
    const defaultData: SMLDatasetColumnSimple = {
      data_type: SMLColumnDataType.String,
      name: "name not set",
    };
    return new YamlDatasetColumnSimpleBuilder(Object.assign(defaultData, data));
  }
  with(data: Partial<SMLDatasetColumnSimple>): YamlDatasetColumnSimpleBuilder {
    return super.with(data) as YamlDatasetColumnSimpleBuilder;
  }
  withDataType(data_type: SMLColumnDataType) {
    return this.with({ data_type });
  }
}

class YamlDatasetColumnMapBuilder extends AnyObjectBuilder<SMLDatasetColumnMap> implements IYamlColumnBuilder {
  static create(data: Partial<SMLDatasetColumnMap> = {}): YamlDatasetColumnMapBuilder {
    const defaultData: SMLDatasetColumnMap = {
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

  with(data: Partial<SMLDatasetColumnMap>): YamlDatasetColumnMapBuilder {
    return super.with(data) as YamlDatasetColumnMapBuilder;
  }

  withMapDefinition(data: SMLDatasetColumnMapDefinition): YamlDatasetColumnMapBuilder {
    return this.with({ map: data });
  }
}

class YamlDatasetColumnDerivedBuilder
  extends AnyObjectBuilder<SMLDatasetColumnDerived>
  implements IYamlColumnBuilder
{
  static create(data: Partial<SMLDatasetColumnDerived> = {}): YamlDatasetColumnDerivedBuilder {
    const defaultData: SMLDatasetColumnDerived = {
      data_type: SMLColumnDataType.String,
      name: "name not set",
      parent_column: "parent column not set",
    };
    return new YamlDatasetColumnDerivedBuilder(Object.assign(defaultData, data));
  }
  with(data: Partial<SMLDatasetColumnDerived>): YamlDatasetColumnDerivedBuilder {
    return super.with(data) as YamlDatasetColumnDerivedBuilder;
  }
}

export interface IYamlColumnBuilder {
  build: () => SMLDatasetColumn;
}

export default class YamlDatasetColumnBuilder {
  static simple(data: Partial<SMLDatasetColumnSimple> = {}): YamlDatasetColumnSimpleBuilder {
    return YamlDatasetColumnSimpleBuilder.create(data);
  }

  static mapColumn(data: Partial<SMLDatasetColumnMap> = {}): YamlDatasetColumnMapBuilder {
    return YamlDatasetColumnMapBuilder.create(data);
  }

  static derivedColumn(data: Partial<SMLDatasetColumnDerived> = {}): YamlDatasetColumnDerivedBuilder {
    return YamlDatasetColumnDerivedBuilder.create(data);
  }
}
