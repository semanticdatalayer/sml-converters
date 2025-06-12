import { ITestCase } from "utils/ObjectInvalidSchemaGenerator";

import { YamlDimensionRelationBuilder } from "../../builders/YamlObjectBuilders/YamlDimensionRelationBuilder";
import {
  SMLDimensionRelationship,
  SMLEmbeddedRelationship,
  SMLSecurityRelationship,
  SMLSnowflakeRelationship,
} from 'sml-sdk';
import YamlDimensionTypeGuard from "./YamlDimensionTypeGuard";

const EMPTY_STRING = "";

const MOCKED_ROW_SECURITY = "MOCKED_ROW_SECURITY";

const MOCKED_DATASET = "MOCKED_DATASET";

const MOCKED_LEVEL = "MOCKED_LEVEL";

const MOCKED_UNIQUE_NAME = "MOCKED_UNIQUE_NAME";

const emptySecurityRelationshipFrom: Pick<SMLSecurityRelationship, "from"> = {
  from: { dataset: EMPTY_STRING, hierarchy: EMPTY_STRING, join_columns: [], level: EMPTY_STRING },
};

const emptySecurityRelationshipTo: Pick<SMLSecurityRelationship, "to"> = { to: { row_security: EMPTY_STRING } };

// Snowflake
const emptySnowflakeRelationshipFrom: Pick<SMLSnowflakeRelationship, "from"> = {
  from: { dataset: EMPTY_STRING, join_columns: [] },
};

const emptySnowflakeRelationshipTo: Pick<SMLSnowflakeRelationship, "to"> = { to: { level: EMPTY_STRING } };

// Embedded
const emptyEmbeddedRelationshipFrom: Pick<SMLEmbeddedRelationship, "from"> = {
  from: { dataset: EMPTY_STRING, hierarchy: EMPTY_STRING, join_columns: [], level: EMPTY_STRING },
};

const emptyEmbeddedRelationshipTo: Pick<SMLEmbeddedRelationship, "to"> = {
  to: { level: EMPTY_STRING, dimension: EMPTY_STRING },
};

const ORPHAN_DIMENSION_RELATIONSHIP_TEST_CASES: ITestCase<SMLEmbeddedRelationship>[] = [
  {
    condition: "testing if emptySecurityTo results in an orphan",
    data: YamlDimensionRelationBuilder.create()
      .with({
        unique_name: MOCKED_UNIQUE_NAME,
        from: { ...emptySecurityRelationshipFrom.from, dataset: MOCKED_DATASET },
        ...emptySecurityRelationshipTo,
      })
      .build(),
  },
  {
    condition: "testing if emptySecurityFrom results in an orphan",
    data: YamlDimensionRelationBuilder.create()
      .withRowSecurity(MOCKED_ROW_SECURITY)
      .with({ unique_name: MOCKED_UNIQUE_NAME, ...emptySecurityRelationshipFrom })
      .build(),
  },

  {
    condition: "testing if emptySnowflakeRelationshipTo results in an orphan",
    data: YamlDimensionRelationBuilder.create()

      .with({
        to: emptySnowflakeRelationshipTo.to,
        from: { ...emptySnowflakeRelationshipFrom.from, dataset: MOCKED_DATASET },
      })
      .build(),
  },
  {
    condition: "testing if emptySnowflakeRelationshipFrom results in an orphan",
    data: YamlDimensionRelationBuilder.create().withLevel(MOCKED_LEVEL).with(emptySnowflakeRelationshipFrom).build(),
  },

  {
    condition: "testing if emptyEmbeddedRelationshipTo results in an orphan",
    data: YamlDimensionRelationBuilder.create()

      .with({
        ...emptyEmbeddedRelationshipTo,
        from: { ...emptyEmbeddedRelationshipFrom.from, dataset: MOCKED_DATASET },
      })
      .build(),
  },
  {
    condition: "testing if emptyEmbeddedRelationshipFrom results in an orphan",
    data: YamlDimensionRelationBuilder.create()
      .withRowSecurity(MOCKED_ROW_SECURITY)
      .with({ unique_name: MOCKED_UNIQUE_NAME, ...emptyEmbeddedRelationshipFrom })
      .build(),
  },
];

describe("Testing cases of Dimension relationships that can be orphans", () => {
  ORPHAN_DIMENSION_RELATIONSHIP_TEST_CASES.forEach(isRelationshipOrphanCallback);
});

function isRelationshipOrphanCallback(value: ITestCase<Partial<SMLEmbeddedRelationship>>) {
  it(`${value.condition} should be orphan`, () => {
    const result = YamlDimensionTypeGuard.isOrphanRelation(value.data as SMLEmbeddedRelationship);

    expect(result).toBe(true);
  });
}
