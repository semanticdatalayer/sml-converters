import { ErrorObject } from "ajv";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { SchemaValidatorErrorFormatter } from "./SchemaValidatorErrorFormatter";

const errorObjectBuilder = AnyObjectBuilder.fromPartial<ErrorObject>({
  instancePath: "dimension",
  schemaPath: "not used",
  keyword: "not used",
  message: "must be string",
});

const mockedData = {
  hierarchies: {
    firstHierarchy: {
      secondHierarchy: {
        levels: [
          {
            firstLevel: {
              label: 123,
            },
          },
        ],
      },
    },
  },
} as unknown as IYamlObject;
const errorFormatter = new SchemaValidatorErrorFormatter();

describe("SchemaValidatorErrorFormatter", () => {
  it.each([
    ["", "must be string"],
    ["prop", "prop must be string"],
    ["/hierarchies/prop", "hierarchies prop must be string"],
    ["/hierarchies/firstHierarchy/prop", "hierarchies -> firstHierarchy prop must be string"],
    [
      "/hierarchies/firstHierarchy/secondHierarchy/prop",
      "hierarchies -> firstHierarchy -> secondHierarchy prop must be string",
    ],
    [
      "/hierarchies/firstHierarchy/secondHierarchy/levels/3",
      "hierarchies -> firstHierarchy -> secondHierarchy -> levels[index: 3] must be string",
    ],
    [
      "/hierarchies/firstHierarchy/secondHierarchy/levels/0/firstLevel/prop",
      "hierarchies -> firstHierarchy -> secondHierarchy -> levels[index: 0] -> firstLevel prop must be string",
    ],
  ])("should return the correct error message. path: %s", (instancePath, correctMessage) => {
    const error = errorObjectBuilder.with({ instancePath }).build();
    const errorMessages = errorFormatter.formatErrors([error], mockedData);

    expect(errorMessages[0]).toBe(correctMessage);
  });
});

const regularErrors = [
  {
    instancePath: "",
    schemaPath: "#/required",
    keyword: "required",
    params: {
      missingProperty: "dataset",
    },
    message: "must have required property 'dataset'",
  },
  {
    instancePath: "",
    schemaPath: "#/required",
    keyword: "required",
    params: {
      missingProperty: "column",
    },
    message: "must have required property 'column'",
  },
  {
    instancePath: "/semi_additive",
    schemaPath: "#/properties/semi_additive/required",
    keyword: "required",
    params: {
      missingProperty: "position",
    },
    message: "must have required property 'position'",
  },
];

const anyOfErrors = [
  {
    instancePath: "/semi_additive",
    schemaPath: "#/properties/semi_additive/anyOf/0/errorMessage",
    keyword: "errorMessage",
    params: {
      errors: [
        {
          instancePath: "/semi_additive",
          schemaPath: "#/properties/semi_additive/anyOf/0/required",
          keyword: "required",
          params: {
            missingProperty: "relationships",
          },
          message: "must have required property 'relationships'",
          emUsed: true,
        },
      ],
    },
    message: "custom error message",
  },
  {
    instancePath: "/semi_additive",
    schemaPath: "#/properties/semi_additive/anyOf/1/errorMessage",
    keyword: "errorMessage",
    params: {
      errors: [
        {
          instancePath: "/semi_additive",
          schemaPath: "#/properties/semi_additive/anyOf/1/required",
          keyword: "required",
          params: {
            missingProperty: "degenerate_dimensions",
          },
          message: "must have required property 'degenerate_dimensions'",
          emUsed: true,
        },
      ],
    },
    message: "custom error message",
  },
  {
    instancePath: "/semi_additive",
    schemaPath: "#/properties/semi_additive/anyOf",
    keyword: "anyOf",
    params: {},
    message: "must match a schema in anyOf",
  },
];

describe("SchemaValidatorErrorFormatter.filterAnyOfErrors ", () => {
  it("Should keep only one any of error", () => {
    const errors = [...regularErrors, ...anyOfErrors];
    const result = errorFormatter.filterAnyOfErrors(errors);

    const mappedResult = result.map((e) => e.message);
    const expectedResult = regularErrors.map((e) => e.message).concat(["custom error message"]);
    expect(mappedResult).toEqual(expectedResult);
  });

  it("Having no anyOf should not modify the result", () => {
    const result = errorFormatter.filterAnyOfErrors(regularErrors);
    expect(result).toEqual(regularErrors);
  });
});
