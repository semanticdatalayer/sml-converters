import { ITestCase } from "utils/ObjectInvalidSchemaGenerator";

import YamlModelRelationBuilder from "../../builders/YamlObjectBuilders/YamlModelRelationBuilder";
import { getJoinColumns, MOCK_DATASET, MOCK_DIMENSION, MOCK_LEVEL, MOCK_ROW_SECURITY } from "../constants";
import { IYamlModelRegularRelationship, IYamlModelRelationship, IYamlModelSecurityRelationship } from "../IYamlModel";
import YamlModelTypeGuard from "./YamlModelTypeGuard";

const EMPTY_STRING = "";

const MOCKED_UNIQUE_NAME = "MOCKED_UNIQUE_NAME";

const MOCKED_DATASET = "MOCKED_DATASET";

const MOCKED_DIMENSION = "MOCKED_DIMENSION";

const MOCKED_VALID_RELATIONSHIP: IYamlModelRelationship = YamlModelRelationBuilder.create()
  .with({
    to: { level: MOCK_LEVEL, dimension: MOCK_DIMENSION, row_security: MOCK_ROW_SECURITY },
    from: { dataset: MOCK_DATASET, join_columns: getJoinColumns(0) },
  })
  .build();

const emptyRegularFrom: Pick<IYamlModelRegularRelationship, "from"> = {
  from: { dataset: EMPTY_STRING, join_columns: [] },
};

const emptyRegularTo: Pick<IYamlModelRegularRelationship, "to"> = {
  to: { dimension: EMPTY_STRING, level: EMPTY_STRING },
};

const emptySecurityFrom: Pick<IYamlModelSecurityRelationship, "from"> = {
  from: { join_columns: [], dataset: EMPTY_STRING },
};

const emptySecurityTo: Pick<IYamlModelSecurityRelationship, "to"> = { to: { row_security: EMPTY_STRING } };

const ORPHAN_MODEL_RELATIONSHIP_TEST_CASES: ITestCase<IYamlModelRelationship>[] = [
  {
    condition: "testing if emptyRegularTo results in an orphan",
    data: YamlModelRelationBuilder.create()
      .addFrom({ dataset: "some dataset", join_columns: [] })
      .with(emptyRegularTo)
      .build(),
  },
  {
    condition: "testing if emptyRegularFrom results in an orphan",
    data: YamlModelRelationBuilder.create()
      .addTo({ dimension: MOCKED_DIMENSION, level: EMPTY_STRING })
      .with(emptyRegularFrom)
      .build(),
  },

  {
    condition: "testing if emptySecurityTo results in an orphan",
    data: YamlModelRelationBuilder.create()
      .with({
        unique_name: MOCKED_UNIQUE_NAME,
        from: { join_columns: [], dataset: MOCKED_DATASET },
        ...emptySecurityTo,
      })
      .build(),
  },
  {
    condition: "testing if emptySecurityFrom results in an orphan",
    data: YamlModelRelationBuilder.create()
      .addTo({ dimension: MOCKED_DIMENSION, level: EMPTY_STRING })
      .with(emptySecurityFrom)
      .build(),
  },
];

function isRelationshipOrphanCallback(value: ITestCase<IYamlModelRelationship>) {
  it(`${value.condition} should be orphan`, () => {
    const testResult = YamlModelTypeGuard.isOrphanRelation(value.data);

    expect(testResult).toBe(true);
  });
}

describe("Automatic cases for yaml Model type guard", () => {
  ORPHAN_MODEL_RELATIONSHIP_TEST_CASES.forEach(isRelationshipOrphanCallback);

  it("should expect a valid relationship to not be an orphan", () => {
    const testResult = YamlModelTypeGuard.isOrphanRelation(MOCKED_VALID_RELATIONSHIP);

    expect(testResult).toBe(false);
  });
});
