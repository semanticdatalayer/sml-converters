import { z } from "zod";

export const dbtAnalysisSchema = z.object({
  name: z.string(),
  columns: z
    .array(
      z
        .object({
          name: z.string(),
          description: z.string().optional(),
          data_type: z.string().optional(),
        })
        .strict(),
    )
    .optional(),
  config: z
    .object({
      tags: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
    })
    .strict()
    .optional(),
  description: z.string().optional(),
  docs: z
    .object({
      node_color: z
        .string()
        .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
        .describe(
          "The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.",
        )
        .optional(),
      show: z.boolean().default(true),
    })
    .strict()
    .describe(
      "Configurations for the appearance of nodes in the dbt documentation.",
    )
    .optional(),
  group: z.string().optional(),
});

export const dbtExposureSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  type: z.enum(["dashboard", "notebook", "analysis", "ml", "application"]),
  depends_on: z.array(z.string()),
  description: z.string().optional(),
  maturity: z.enum(["high", "medium", "low"]).optional(),
  meta: z.record(z.any()).optional(),
  owner: z.object({ name: z.string().optional(), email: z.string() }).strict(),
  tags: z
    .any()
    .superRefine((x, ctx) => {
      const schemas = [z.string(), z.array(z.string())];
      const errors = schemas.reduce(
        (errors: z.ZodError[], schema) =>
          ((result) =>
            "error" in result ? [...errors, result.error] : errors)(
            schema.safeParse(x),
          ),
        [],
      );
      if (schemas.length - errors.length !== 1) {
        ctx.addIssue({
          path: ctx.path,
          code: "invalid_union",
          unionErrors: errors,
          message: "Invalid input: Should pass single schema",
        });
      }
    })
    .optional(),
  url: z.string().optional(),
});

export const dbtGroupsSchema = z
  .object({
    name: z.string(),
    owner: z
      .object({
        name: z.string().optional(),
        email: z.string().optional(),
      })
      .catchall(z.any()),
  })
  .strict();

export const dbtMacroSchema = z
  .object({
    name: z.string(),
    arguments: z
      .array(
        z
          .object({
            name: z.string(),
            type: z.string().optional(),
            description: z.string().optional(),
          })
          .strict(),
      )
      .optional(),
    description: z.string().optional(),
    docs: z
      .object({
        node_color: z
          .string()
          .regex(
            new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"),
          )
          .describe(
            "The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.",
          )
          .optional(),
        show: z.boolean().default(true),
      })
      .strict()
      .describe(
        "Configurations for the appearance of nodes in the dbt documentation.",
      )
      .optional(),
  })
  .strict();

export const dbtMetricSchema = z.object({
  description: z.string().optional(),
  filter: z.string().optional(),
  group: z.string().optional(),
  label: z.string(),
  name: z.string().regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")),
  type: z.enum([
    "SIMPLE",
    "RATIO",
    "CUMULATIVE",
    "DERIVED",
    "simple",
    "ratio",
    "cumulative",
    "derived",
    "conversion",
    "CONVERSION",
  ]),
  type_params: z.object({
    denominator: z
      .any()
      .superRefine((x, ctx) => {
        const schemas = [
          z.string(),
          z
            .object({
              alias: z.string().optional(),
              filter: z.string().optional(),
              name: z.string().optional(),
            })
            .strict(),
        ];
        const errors = schemas.reduce(
          (errors: z.ZodError[], schema) =>
            ((result) =>
              "error" in result ? [...errors, result.error] : errors)(
              schema.safeParse(x),
            ),
          [],
        );
        if (schemas.length - errors.length !== 1) {
          ctx.addIssue({
            path: ctx.path,
            code: "invalid_union",
            unionErrors: errors,
            message: "Invalid input: Should pass single schema",
          });
        }
      })
      .optional(),
    expr: z.union([z.string(), z.boolean()]).optional(),
    grain_to_date: z.string().optional(),
    measure: z
      .any()
      .superRefine((x, ctx) => {
        const schemas = [
          z.string(),
          z.object({
            alias: z.string().optional(),
            filter: z.string().optional(),
            name: z.string().optional(),
          }),
        ];
        const errors = schemas.reduce(
          (errors: z.ZodError[], schema) =>
            ((result) =>
              "error" in result ? [...errors, result.error] : errors)(
              schema.safeParse(x),
            ),
          [],
        );
        if (schemas.length - errors.length !== 1) {
          ctx.addIssue({
            path: ctx.path,
            code: "invalid_union",
            unionErrors: errors,
            message: "Invalid input: Should pass single schema",
          });
        }
      })
      .optional(),
    metrics: z
      .array(
        z.union([
          z
            .object({
              alias: z.string().optional(),
              filter: z.string().optional(),
              name: z.string().optional(),
              offset_to_grain: z.string().optional(),
              offset_window: z.string().optional(),
            })
            .strict(),
          z.string(),
        ]),
      )
      .optional(),
    numerator: z
      .any()
      .superRefine((x, ctx) => {
        const schemas = [
          z.string(),
          z
            .object({
              alias: z.string().optional(),
              filter: z.string().optional(),
              name: z.string().optional(),
            })
            .strict(),
        ];
        const errors = schemas.reduce(
          (errors: z.ZodError[], schema) =>
            ((result) =>
              "error" in result ? [...errors, result.error] : errors)(
              schema.safeParse(x),
            ),
          [],
        );
        if (schemas.length - errors.length !== 1) {
          ctx.addIssue({
            path: ctx.path,
            code: "invalid_union",
            unionErrors: errors,
            message: "Invalid input: Should pass single schema",
          });
        }
      })
      .optional(),
    window: z.string().optional(),
  }),
});

export const dbtModelsSchema = z.object({
  name: z.string(),
  access: z.enum(["private", "protected", "public"]).optional(),
  columns: z
    .array(
      z.object({
        name: z.string(),
        constraints: z
          .array(
            z.object({
              columns: z
                .any()
                .superRefine((x, ctx) => {
                  const schemas = [z.string(), z.array(z.string())];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) =>
                        "error" in result ? [...errors, result.error] : errors)(
                        schema.safeParse(x),
                      ),
                    [],
                  );
                  if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                      path: ctx.path,
                      code: "invalid_union",
                      unionErrors: errors,
                      message: "Invalid input: Should pass single schema",
                    });
                  }
                })
                .optional(),
              expression: z.string().optional(),
              name: z.string().optional(),
              type: z.string(),
              warn_unenforced: z
                .any()
                .superRefine((x, ctx) => {
                  const schemas = [
                    z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                    z.boolean(),
                  ];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) =>
                        "error" in result ? [...errors, result.error] : errors)(
                        schema.safeParse(x),
                      ),
                    [],
                  );
                  if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                      path: ctx.path,
                      code: "invalid_union",
                      unionErrors: errors,
                      message: "Invalid input: Should pass single schema",
                    });
                  }
                })
                .optional(),
              warn_unsupported: z
                .any()
                .superRefine((x, ctx) => {
                  const schemas = [
                    z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                    z.boolean(),
                  ];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) =>
                        "error" in result ? [...errors, result.error] : errors)(
                        schema.safeParse(x),
                      ),
                    [],
                  );
                  if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                      path: ctx.path,
                      code: "invalid_union",
                      unionErrors: errors,
                      message: "Invalid input: Should pass single schema",
                    });
                  }
                })
                .optional(),
            }),
          )
          .optional(),
        data_type: z.string().optional(),
        description: z.string().optional(),
        meta: z.record(z.any()).optional(),
        policy_tags: z
          .array(z.string())
          .describe(
            "Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.",
          )
          .optional(),
        quote: z
          .any()
          .superRefine((x, ctx) => {
            const schemas = [
              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
              z.boolean(),
            ];
            const errors = schemas.reduce(
              (errors: z.ZodError[], schema) =>
                ((result) =>
                  "error" in result ? [...errors, result.error] : errors)(
                  schema.safeParse(x),
                ),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          })
          .optional(),
        tests: z
          .array(
            z.union([
              z.string(),
              z.object({
                relationships: z
                  .object({
                    name: z.string().optional(),
                    config: z
                      .object({
                        alias: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        database: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        enabled: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        error_if: z.string().optional(),
                        fail_calc: z.string().optional(),
                        limit: z.number().optional(),
                        schema: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        severity: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        store_failures: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        tags: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [z.string(), z.array(z.string())];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        warn_if: z.string().optional(),
                      })
                      .describe(
                        "Configurations set here will override configs set in dbt_project.yml.",
                      )
                      .optional(),
                    field: z
                      .string()
                      .describe("The foreign key column")
                      .default("<FOREIGN_KEY_COLUMN>"),
                    to: z.string().default("ref('')"),
                    where: z.string().optional(),
                  })
                  .optional(),
              }),
              z.object({
                accepted_values: z
                  .object({
                    name: z.string().optional(),
                    config: z
                      .object({
                        alias: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        database: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        enabled: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        error_if: z.string().optional(),
                        fail_calc: z.string().optional(),
                        limit: z.number().optional(),
                        schema: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        severity: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        store_failures: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        tags: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [z.string(), z.array(z.string())];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        warn_if: z.string().optional(),
                      })
                      .describe(
                        "Configurations set here will override configs set in dbt_project.yml.",
                      )
                      .optional(),
                    quote: z.boolean().optional(),
                    values: z.array(z.string()),
                    where: z.string().optional(),
                  })
                  .optional(),
              }),
              z.object({
                not_null: z
                  .object({
                    name: z.string().optional(),
                    config: z
                      .object({
                        alias: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        database: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        enabled: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        error_if: z.string().optional(),
                        fail_calc: z.string().optional(),
                        limit: z.number().optional(),
                        schema: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        severity: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        store_failures: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        tags: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [z.string(), z.array(z.string())];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        warn_if: z.string().optional(),
                      })
                      .describe(
                        "Configurations set here will override configs set in dbt_project.yml.",
                      )
                      .optional(),
                    where: z.string().optional(),
                  })
                  .optional(),
              }),
              z.object({
                unique: z
                  .object({
                    name: z.string().optional(),
                    config: z
                      .object({
                        alias: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        database: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        enabled: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        error_if: z.string().optional(),
                        fail_calc: z.string().optional(),
                        limit: z.number().optional(),
                        schema: z
                          .string()
                          .describe(
                            "Only relevant when `store_failures` is true",
                          )
                          .optional(),
                        severity: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        store_failures: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        tags: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [z.string(), z.array(z.string())];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        warn_if: z.string().optional(),
                      })
                      .describe(
                        "Configurations set here will override configs set in dbt_project.yml.",
                      )
                      .optional(),
                    where: z.string().optional(),
                  })
                  .optional(),
              }),
            ]),
          )
          .optional(),
        tags: z
          .any()
          .superRefine((x, ctx) => {
            const schemas = [z.string(), z.array(z.string())];
            const errors = schemas.reduce(
              (errors: z.ZodError[], schema) =>
                ((result) =>
                  "error" in result ? [...errors, result.error] : errors)(
                  schema.safeParse(x),
                ),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          })
          .optional(),
      }),
    )
    .optional(),
  config: z
    .object({
      auto_refresh: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [
            z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
            z.boolean(),
          ];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
      backup: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [
            z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
            z.boolean(),
          ];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
      contract: z
        .object({
          enforced: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [
                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                z.boolean(),
              ];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) =>
                    "error" in result ? [...errors, result.error] : errors)(
                    schema.safeParse(x),
                  ),
                [],
              );
              if (schemas.length - errors.length !== 1) {
                ctx.addIssue({
                  path: ctx.path,
                  code: "invalid_union",
                  unionErrors: errors,
                  message: "Invalid input: Should pass single schema",
                });
              }
            })
            .optional(),
        })
        .optional(),
      file_format: z.string().optional(),
      grant_access_to: z
        .array(z.object({ database: z.string(), project: z.string() }).strict())
        .describe(
          "Configuration, specific to BigQuery adapter, used to setup authorized views.",
        )
        .optional(),
      grants: z
        .record(
          z.union([
            z.any().superRefine((x, ctx) => {
              const schemas = [z.string(), z.array(z.string())];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) =>
                    "error" in result ? [...errors, result.error] : errors)(
                    schema.safeParse(x),
                  ),
                [],
              );
              if (schemas.length - errors.length !== 1) {
                ctx.addIssue({
                  path: ctx.path,
                  code: "invalid_union",
                  unionErrors: errors,
                  message: "Invalid input: Should pass single schema",
                });
              }
            }),
            z.never(),
          ]),
        )
        .superRefine((value, ctx) => {
          for (const key in value) {
            let evaluated = false;
            if (key.match(new RegExp(".*"))) {
              evaluated = true;
              const result = z
                .any()
                .superRefine((x, ctx) => {
                  const schemas = [z.string(), z.array(z.string())];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) =>
                        "error" in result ? [...errors, result.error] : errors)(
                        schema.safeParse(x),
                      ),
                    [],
                  );
                  if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                      path: ctx.path,
                      code: "invalid_union",
                      unionErrors: errors,
                      message: "Invalid input: Should pass single schema",
                    });
                  }
                })
                .safeParse(value[key]);
              if (!result.success) {
                ctx.addIssue({
                  path: [...ctx.path, key],
                  code: "custom",
                  message: `Invalid input: Key matching regex /${key}/ must match schema`,
                  params: {
                    issues: result.error.issues,
                  },
                });
              }
            }
            if (!evaluated) {
              const result = z.never().safeParse(value[key]);
              if (!result.success) {
                ctx.addIssue({
                  path: [...ctx.path, key],
                  code: "custom",
                  message: `Invalid input: must match catchall schema`,
                  params: {
                    issues: result.error.issues,
                  },
                });
              }
            }
          }
        })
        .describe(
          "grant config. each key is a database permission and the value is the grantee of that permission",
        )
        .optional(),
      hours_to_expiration: z
        .number()
        .describe(
          "Configuration specific to BigQuery adapter used to set an expiration delay (in hours) to a table.",
        )
        .optional(),
      kms_key_name: z
        .string()
        .regex(
          new RegExp(
            "projects/[a-zA-Z0-9_-]*/locations/[a-zA-Z0-9_-]*/keyRings/.*/cryptoKeys/.*",
          ),
        )
        .describe(
          "Configuration of the KMS key name, specific to BigQuery adapter.",
        )
        .optional(),
      labels: z
        .record(
          z.union([
            z.string().regex(new RegExp("^[a-z0-9_-]{0,63}$")),
            z.never(),
          ]),
        )
        .superRefine((value, ctx) => {
          for (const key in value) {
            let evaluated = false;
            if (key.match(new RegExp("^[a-z][a-z0-9_-]{0,62}$"))) {
              evaluated = true;
              const result = z
                .string()
                .regex(new RegExp("^[a-z0-9_-]{0,63}$"))
                .safeParse(value[key]);
              if (!result.success) {
                ctx.addIssue({
                  path: [...ctx.path, key],
                  code: "custom",
                  message: `Invalid input: Key matching regex /${key}/ must match schema`,
                  params: {
                    issues: result.error.issues,
                  },
                });
              }
            }
            if (!evaluated) {
              const result = z.never().safeParse(value[key]);
              if (!result.success) {
                ctx.addIssue({
                  path: [...ctx.path, key],
                  code: "custom",
                  message: `Invalid input: must match catchall schema`,
                  params: {
                    issues: result.error.issues,
                  },
                });
              }
            }
          }
        })
        .describe(
          "Configuration specific to BigQuery adapter used to add labels and tags to tables/views created by dbt.",
        )
        .optional(),
      location: z.string().optional(),
      materialized: z.string().optional(),
      on_configuration_change: z.enum(["apply", "continue", "fail"]).optional(),
      on_schema_change: z
        .enum(["append_new_columns", "fail", "ignore", "sync_all_columns"])
        .optional(),
      sql_header: z.string().optional(),
      snowflake_warehouse: z.string().optional(),
      target_lag: z
        .string()
        .regex(
          new RegExp("^(?:downstream|\\d+\\s*(?:seconds|minutes|hours|days))$"),
        )
        .optional(),
    })
    .optional(),
  constraints: z
    .array(
      z.object({
        columns: z
          .any()
          .superRefine((x, ctx) => {
            const schemas = [z.string(), z.array(z.string())];
            const errors = schemas.reduce(
              (errors: z.ZodError[], schema) =>
                ((result) =>
                  "error" in result ? [...errors, result.error] : errors)(
                  schema.safeParse(x),
                ),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          })
          .optional(),
        expression: z.string().optional(),
        name: z.string().optional(),
        type: z.string(),
        warn_unenforced: z
          .any()
          .superRefine((x, ctx) => {
            const schemas = [
              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
              z.boolean(),
            ];
            const errors = schemas.reduce(
              (errors: z.ZodError[], schema) =>
                ((result) =>
                  "error" in result ? [...errors, result.error] : errors)(
                  schema.safeParse(x),
                ),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          })
          .optional(),
        warn_unsupported: z
          .any()
          .superRefine((x, ctx) => {
            const schemas = [
              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
              z.boolean(),
            ];
            const errors = schemas.reduce(
              (errors: z.ZodError[], schema) =>
                ((result) =>
                  "error" in result ? [...errors, result.error] : errors)(
                  schema.safeParse(x),
                ),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          })
          .optional(),
      }),
    )
    .optional(),
  description: z.string().optional(),
  docs: z
    .object({
      node_color: z
        .string()
        .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
        .describe(
          "The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.",
        )
        .optional(),
      show: z.boolean().default(true),
    })
    .strict()
    .describe(
      "Configurations for the appearance of nodes in the dbt documentation.",
    )
    .optional(),
  group: z.string().optional(),
  latest_version: z.number().optional(),
  meta: z.record(z.any()).optional(),
  tests: z
    .array(
      z.union([
        z.string(),
        z.object({
          relationships: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              field: z
                .string()
                .describe("The foreign key column")
                .default("<FOREIGN_KEY_COLUMN>"),
              to: z.string().default("ref('')"),
              where: z.string().optional(),
            })
            .optional(),
        }),
        z.object({
          accepted_values: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              quote: z.boolean().optional(),
              values: z.array(z.string()),
              where: z.string().optional(),
            })
            .optional(),
        }),
        z.object({
          not_null: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              where: z.string().optional(),
            })
            .optional(),
        }),
        z.object({
          unique: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              where: z.string().optional(),
            })
            .optional(),
        }),
      ]),
    )
    .optional(),
  versions: z
    .array(
      z.object({
        v: z.number(),
        config: z
          .object({
            auto_refresh: z
              .any()
              .superRefine((x, ctx) => {
                const schemas = [
                  z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                  z.boolean(),
                ];
                const errors = schemas.reduce(
                  (errors: z.ZodError[], schema) =>
                    ((result) =>
                      "error" in result ? [...errors, result.error] : errors)(
                      schema.safeParse(x),
                    ),
                  [],
                );
                if (schemas.length - errors.length !== 1) {
                  ctx.addIssue({
                    path: ctx.path,
                    code: "invalid_union",
                    unionErrors: errors,
                    message: "Invalid input: Should pass single schema",
                  });
                }
              })
              .optional(),
            backup: z
              .any()
              .superRefine((x, ctx) => {
                const schemas = [
                  z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                  z.boolean(),
                ];
                const errors = schemas.reduce(
                  (errors: z.ZodError[], schema) =>
                    ((result) =>
                      "error" in result ? [...errors, result.error] : errors)(
                      schema.safeParse(x),
                    ),
                  [],
                );
                if (schemas.length - errors.length !== 1) {
                  ctx.addIssue({
                    path: ctx.path,
                    code: "invalid_union",
                    unionErrors: errors,
                    message: "Invalid input: Should pass single schema",
                  });
                }
              })
              .optional(),
            contract: z
              .object({
                enforced: z
                  .any()
                  .superRefine((x, ctx) => {
                    const schemas = [
                      z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                      z.boolean(),
                    ];
                    const errors = schemas.reduce(
                      (errors: z.ZodError[], schema) =>
                        ((result) =>
                          "error" in result
                            ? [...errors, result.error]
                            : errors)(schema.safeParse(x)),
                      [],
                    );
                    if (schemas.length - errors.length !== 1) {
                      ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                      });
                    }
                  })
                  .optional(),
              })
              .optional(),
            file_format: z.string().optional(),
            grant_access_to: z
              .array(
                z
                  .object({
                    database: z.string(),
                    project: z.string(),
                  })
                  .strict(),
              )
              .describe(
                "Configuration, specific to BigQuery adapter, used to setup authorized views.",
              )
              .optional(),
            grants: z
              .record(
                z.union([
                  z.any().superRefine((x, ctx) => {
                    const schemas = [z.string(), z.array(z.string())];
                    const errors = schemas.reduce(
                      (errors: z.ZodError[], schema) =>
                        ((result) =>
                          "error" in result
                            ? [...errors, result.error]
                            : errors)(schema.safeParse(x)),
                      [],
                    );
                    if (schemas.length - errors.length !== 1) {
                      ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                      });
                    }
                  }),
                  z.never(),
                ]),
              )
              .superRefine((value, ctx) => {
                for (const key in value) {
                  let evaluated = false;
                  if (key.match(new RegExp(".*"))) {
                    evaluated = true;
                    const result = z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [z.string(), z.array(z.string())];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .safeParse(value[key]);
                    if (!result.success) {
                      ctx.addIssue({
                        path: [...ctx.path, key],
                        code: "custom",
                        message: `Invalid input: Key matching regex /${key}/ must match schema`,
                        params: {
                          issues: result.error.issues,
                        },
                      });
                    }
                  }
                  if (!evaluated) {
                    const result = z.never().safeParse(value[key]);
                    if (!result.success) {
                      ctx.addIssue({
                        path: [...ctx.path, key],
                        code: "custom",
                        message: `Invalid input: must match catchall schema`,
                        params: {
                          issues: result.error.issues,
                        },
                      });
                    }
                  }
                }
              })
              .describe(
                "grant config. each key is a database permission and the value is the grantee of that permission",
              )
              .optional(),
            hours_to_expiration: z
              .number()
              .describe(
                "Configuration specific to BigQuery adapter used to set an expiration delay (in hours) to a table.",
              )
              .optional(),
            kms_key_name: z
              .string()
              .regex(
                new RegExp(
                  "projects/[a-zA-Z0-9_-]*/locations/[a-zA-Z0-9_-]*/keyRings/.*/cryptoKeys/.*",
                ),
              )
              .describe(
                "Configuration of the KMS key name, specific to BigQuery adapter.",
              )
              .optional(),
            labels: z
              .record(
                z.union([
                  z.string().regex(new RegExp("^[a-z0-9_-]{0,63}$")),
                  z.never(),
                ]),
              )
              .superRefine((value, ctx) => {
                for (const key in value) {
                  let evaluated = false;
                  if (key.match(new RegExp("^[a-z][a-z0-9_-]{0,62}$"))) {
                    evaluated = true;
                    const result = z
                      .string()
                      .regex(new RegExp("^[a-z0-9_-]{0,63}$"))
                      .safeParse(value[key]);
                    if (!result.success) {
                      ctx.addIssue({
                        path: [...ctx.path, key],
                        code: "custom",
                        message: `Invalid input: Key matching regex /${key}/ must match schema`,
                        params: {
                          issues: result.error.issues,
                        },
                      });
                    }
                  }
                  if (!evaluated) {
                    const result = z.never().safeParse(value[key]);
                    if (!result.success) {
                      ctx.addIssue({
                        path: [...ctx.path, key],
                        code: "custom",
                        message: `Invalid input: must match catchall schema`,
                        params: {
                          issues: result.error.issues,
                        },
                      });
                    }
                  }
                }
              })
              .describe(
                "Configuration specific to BigQuery adapter used to add labels and tags to tables/views created by dbt.",
              )
              .optional(),
            location: z.string().optional(),
            materialized: z.string().optional(),
            on_configuration_change: z
              .enum(["apply", "continue", "fail"])
              .optional(),
            on_schema_change: z
              .enum([
                "append_new_columns",
                "fail",
                "ignore",
                "sync_all_columns",
              ])
              .optional(),
            sql_header: z.string().optional(),
            snowflake_warehouse: z.string().optional(),
            target_lag: z
              .string()
              .regex(
                new RegExp(
                  "^(?:downstream|\\d+\\s*(?:seconds|minutes|hours|days))$",
                ),
              )
              .optional(),
          })
          .optional(),
        columns: z
          .array(
            z.union([
              z.object({
                include: z
                  .any()
                  .superRefine((x, ctx) => {
                    const schemas = [z.string(), z.array(z.string())];
                    const errors = schemas.reduce(
                      (errors: z.ZodError[], schema) =>
                        ((result) =>
                          "error" in result
                            ? [...errors, result.error]
                            : errors)(schema.safeParse(x)),
                      [],
                    );
                    if (schemas.length - errors.length !== 1) {
                      ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                      });
                    }
                  })
                  .optional(),
                exclude: z
                  .any()
                  .superRefine((x, ctx) => {
                    const schemas = [z.string(), z.array(z.string())];
                    const errors = schemas.reduce(
                      (errors: z.ZodError[], schema) =>
                        ((result) =>
                          "error" in result
                            ? [...errors, result.error]
                            : errors)(schema.safeParse(x)),
                      [],
                    );
                    if (schemas.length - errors.length !== 1) {
                      ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                      });
                    }
                  })
                  .optional(),
              }),
              z
                .object({
                  name: z.string(),
                  constraints: z
                    .array(
                      z.object({
                        columns: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [z.string(), z.array(z.string())];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        expression: z.string().optional(),
                        name: z.string().optional(),
                        type: z.string(),
                        warn_unenforced: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        warn_unsupported: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                      }),
                    )
                    .optional(),
                  data_type: z.string().optional(),
                  description: z.string().optional(),
                  meta: z.record(z.any()).optional(),
                  policy_tags: z
                    .array(z.string())
                    .describe(
                      "Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.",
                    )
                    .optional(),
                  quote: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tests: z
                    .array(
                      z.union([
                        z.string(),
                        z.object({
                          relationships: z
                            .object({
                              name: z.string().optional(),
                              config: z
                                .object({
                                  alias: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  database: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  enabled: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  error_if: z.string().optional(),
                                  fail_calc: z.string().optional(),
                                  limit: z.number().optional(),
                                  schema: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  severity: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.enum(["warn", "error"]),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  store_failures: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  tags: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z.string(),
                                        z.array(z.string()),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  warn_if: z.string().optional(),
                                })
                                .describe(
                                  "Configurations set here will override configs set in dbt_project.yml.",
                                )
                                .optional(),
                              field: z
                                .string()
                                .describe("The foreign key column")
                                .default("<FOREIGN_KEY_COLUMN>"),
                              to: z.string().default("ref('')"),
                              where: z.string().optional(),
                            })
                            .optional(),
                        }),
                        z.object({
                          accepted_values: z
                            .object({
                              name: z.string().optional(),
                              config: z
                                .object({
                                  alias: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  database: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  enabled: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  error_if: z.string().optional(),
                                  fail_calc: z.string().optional(),
                                  limit: z.number().optional(),
                                  schema: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  severity: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.enum(["warn", "error"]),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  store_failures: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  tags: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z.string(),
                                        z.array(z.string()),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  warn_if: z.string().optional(),
                                })
                                .describe(
                                  "Configurations set here will override configs set in dbt_project.yml.",
                                )
                                .optional(),
                              quote: z.boolean().optional(),
                              values: z.array(z.string()),
                              where: z.string().optional(),
                            })
                            .optional(),
                        }),
                        z.object({
                          not_null: z
                            .object({
                              name: z.string().optional(),
                              config: z
                                .object({
                                  alias: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  database: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  enabled: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  error_if: z.string().optional(),
                                  fail_calc: z.string().optional(),
                                  limit: z.number().optional(),
                                  schema: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  severity: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.enum(["warn", "error"]),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  store_failures: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  tags: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z.string(),
                                        z.array(z.string()),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  warn_if: z.string().optional(),
                                })
                                .describe(
                                  "Configurations set here will override configs set in dbt_project.yml.",
                                )
                                .optional(),
                              where: z.string().optional(),
                            })
                            .optional(),
                        }),
                        z.object({
                          unique: z
                            .object({
                              name: z.string().optional(),
                              config: z
                                .object({
                                  alias: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  database: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  enabled: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  error_if: z.string().optional(),
                                  fail_calc: z.string().optional(),
                                  limit: z.number().optional(),
                                  schema: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  severity: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.enum(["warn", "error"]),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  store_failures: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  tags: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z.string(),
                                        z.array(z.string()),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  warn_if: z.string().optional(),
                                })
                                .describe(
                                  "Configurations set here will override configs set in dbt_project.yml.",
                                )
                                .optional(),
                              where: z.string().optional(),
                            })
                            .optional(),
                        }),
                      ]),
                    )
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                })
                .strict(),
            ]),
          )
          .optional(),
      }),
    )
    .optional(),
});

export const dbtSeedsSchema = z
  .object({
    name: z.string(),
    columns: z
      .array(
        z
          .object({
            name: z.string(),
            constraints: z
              .array(
                z.object({
                  columns: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  expression: z.string().optional(),
                  name: z.string().optional(),
                  type: z.string(),
                  warn_unenforced: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_unsupported: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                }),
              )
              .optional(),
            data_type: z.string().optional(),
            description: z.string().optional(),
            meta: z.record(z.any()).optional(),
            policy_tags: z
              .array(z.string())
              .describe(
                "Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.",
              )
              .optional(),
            quote: z
              .any()
              .superRefine((x, ctx) => {
                const schemas = [
                  z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                  z.boolean(),
                ];
                const errors = schemas.reduce(
                  (errors: z.ZodError[], schema) =>
                    ((result) =>
                      "error" in result ? [...errors, result.error] : errors)(
                      schema.safeParse(x),
                    ),
                  [],
                );
                if (schemas.length - errors.length !== 1) {
                  ctx.addIssue({
                    path: ctx.path,
                    code: "invalid_union",
                    unionErrors: errors,
                    message: "Invalid input: Should pass single schema",
                  });
                }
              })
              .optional(),
            tests: z
              .array(
                z.union([
                  z.string(),
                  z.object({
                    relationships: z
                      .object({
                        name: z.string().optional(),
                        config: z
                          .object({
                            alias: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            database: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            enabled: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.boolean(),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            error_if: z.string().optional(),
                            fail_calc: z.string().optional(),
                            limit: z.number().optional(),
                            schema: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            severity: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.enum(["warn", "error"]),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            store_failures: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.boolean(),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            tags: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z.string(),
                                  z.array(z.string()),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            warn_if: z.string().optional(),
                          })
                          .describe(
                            "Configurations set here will override configs set in dbt_project.yml.",
                          )
                          .optional(),
                        field: z
                          .string()
                          .describe("The foreign key column")
                          .default("<FOREIGN_KEY_COLUMN>"),
                        to: z.string().default("ref('')"),
                        where: z.string().optional(),
                      })
                      .optional(),
                  }),
                  z.object({
                    accepted_values: z
                      .object({
                        name: z.string().optional(),
                        config: z
                          .object({
                            alias: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            database: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            enabled: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.boolean(),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            error_if: z.string().optional(),
                            fail_calc: z.string().optional(),
                            limit: z.number().optional(),
                            schema: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            severity: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.enum(["warn", "error"]),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            store_failures: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.boolean(),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            tags: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z.string(),
                                  z.array(z.string()),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            warn_if: z.string().optional(),
                          })
                          .describe(
                            "Configurations set here will override configs set in dbt_project.yml.",
                          )
                          .optional(),
                        quote: z.boolean().optional(),
                        values: z.array(z.string()),
                        where: z.string().optional(),
                      })
                      .optional(),
                  }),
                  z.object({
                    not_null: z
                      .object({
                        name: z.string().optional(),
                        config: z
                          .object({
                            alias: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            database: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            enabled: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.boolean(),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            error_if: z.string().optional(),
                            fail_calc: z.string().optional(),
                            limit: z.number().optional(),
                            schema: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            severity: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.enum(["warn", "error"]),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            store_failures: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.boolean(),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            tags: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z.string(),
                                  z.array(z.string()),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            warn_if: z.string().optional(),
                          })
                          .describe(
                            "Configurations set here will override configs set in dbt_project.yml.",
                          )
                          .optional(),
                        where: z.string().optional(),
                      })
                      .optional(),
                  }),
                  z.object({
                    unique: z
                      .object({
                        name: z.string().optional(),
                        config: z
                          .object({
                            alias: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            database: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            enabled: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.boolean(),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            error_if: z.string().optional(),
                            fail_calc: z.string().optional(),
                            limit: z.number().optional(),
                            schema: z
                              .string()
                              .describe(
                                "Only relevant when `store_failures` is true",
                              )
                              .optional(),
                            severity: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.enum(["warn", "error"]),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            store_failures: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z
                                    .string()
                                    .regex(new RegExp("\\{\\{.*\\}\\}")),
                                  z.boolean(),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            tags: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [
                                  z.string(),
                                  z.array(z.string()),
                                ];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) =>
                                      "error" in result
                                        ? [...errors, result.error]
                                        : errors)(schema.safeParse(x)),
                                  [],
                                );
                                if (schemas.length - errors.length !== 1) {
                                  ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message:
                                      "Invalid input: Should pass single schema",
                                  });
                                }
                              })
                              .optional(),
                            warn_if: z.string().optional(),
                          })
                          .describe(
                            "Configurations set here will override configs set in dbt_project.yml.",
                          )
                          .optional(),
                        where: z.string().optional(),
                      })
                      .optional(),
                  }),
                ]),
              )
              .optional(),
            tags: z
              .any()
              .superRefine((x, ctx) => {
                const schemas = [z.string(), z.array(z.string())];
                const errors = schemas.reduce(
                  (errors: z.ZodError[], schema) =>
                    ((result) =>
                      "error" in result ? [...errors, result.error] : errors)(
                      schema.safeParse(x),
                    ),
                  [],
                );
                if (schemas.length - errors.length !== 1) {
                  ctx.addIssue({
                    path: ctx.path,
                    code: "invalid_union",
                    unionErrors: errors,
                    message: "Invalid input: Should pass single schema",
                  });
                }
              })
              .optional(),
          })
          .strict(),
      )
      .optional(),
    config: z
      .object({
        column_types: z.record(z.any()).optional(),
        copy_grants: z
          .any()
          .superRefine((x, ctx) => {
            const schemas = [
              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
              z.boolean(),
            ];
            const errors = schemas.reduce(
              (errors: z.ZodError[], schema) =>
                ((result) =>
                  "error" in result ? [...errors, result.error] : errors)(
                  schema.safeParse(x),
                ),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          })
          .optional(),
        database: z.string().optional(),
        enabled: z
          .any()
          .superRefine((x, ctx) => {
            const schemas = [
              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
              z.boolean(),
            ];
            const errors = schemas.reduce(
              (errors: z.ZodError[], schema) =>
                ((result) =>
                  "error" in result ? [...errors, result.error] : errors)(
                  schema.safeParse(x),
                ),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          })
          .optional(),
        grants: z
          .record(
            z.union([
              z.any().superRefine((x, ctx) => {
                const schemas = [z.string(), z.array(z.string())];
                const errors = schemas.reduce(
                  (errors: z.ZodError[], schema) =>
                    ((result) =>
                      "error" in result ? [...errors, result.error] : errors)(
                      schema.safeParse(x),
                    ),
                  [],
                );
                if (schemas.length - errors.length !== 1) {
                  ctx.addIssue({
                    path: ctx.path,
                    code: "invalid_union",
                    unionErrors: errors,
                    message: "Invalid input: Should pass single schema",
                  });
                }
              }),
              z.never(),
            ]),
          )
          .superRefine((value, ctx) => {
            for (const key in value) {
              let evaluated = false;
              if (key.match(new RegExp(".*"))) {
                evaluated = true;
                const result = z
                  .any()
                  .superRefine((x, ctx) => {
                    const schemas = [z.string(), z.array(z.string())];
                    const errors = schemas.reduce(
                      (errors: z.ZodError[], schema) =>
                        ((result) =>
                          "error" in result
                            ? [...errors, result.error]
                            : errors)(schema.safeParse(x)),
                      [],
                    );
                    if (schemas.length - errors.length !== 1) {
                      ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                      });
                    }
                  })
                  .safeParse(value[key]);
                if (!result.success) {
                  ctx.addIssue({
                    path: [...ctx.path, key],
                    code: "custom",
                    message: `Invalid input: Key matching regex /${key}/ must match schema`,
                    params: {
                      issues: result.error.issues,
                    },
                  });
                }
              }
              if (!evaluated) {
                const result = z.never().safeParse(value[key]);
                if (!result.success) {
                  ctx.addIssue({
                    path: [...ctx.path, key],
                    code: "custom",
                    message: `Invalid input: must match catchall schema`,
                    params: {
                      issues: result.error.issues,
                    },
                  });
                }
              }
            }
          })
          .describe(
            "grant config. each key is a database permission and the value is the grantee of that permission",
          )
          .optional(),
        quote_columns: z
          .any()
          .superRefine((x, ctx) => {
            const schemas = [
              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
              z.boolean(),
            ];
            const errors = schemas.reduce(
              (errors: z.ZodError[], schema) =>
                ((result) =>
                  "error" in result ? [...errors, result.error] : errors)(
                  schema.safeParse(x),
                ),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          })
          .optional(),
        schema: z.string().optional(),
      })
      .optional(),
    description: z.string().optional(),
    docs: z
      .object({
        node_color: z
          .string()
          .regex(
            new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"),
          )
          .describe(
            "The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.",
          )
          .optional(),
        show: z.boolean().default(true),
      })
      .strict()
      .describe(
        "Configurations for the appearance of nodes in the dbt documentation.",
      )
      .optional(),
    group: z.string().optional(),
    tests: z
      .array(
        z.union([
          z.string(),
          z.object({
            relationships: z
              .object({
                name: z.string().optional(),
                config: z
                  .object({
                    alias: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    database: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    enabled: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.boolean(),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    error_if: z.string().optional(),
                    fail_calc: z.string().optional(),
                    limit: z.number().optional(),
                    schema: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    severity: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.enum(["warn", "error"]),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    store_failures: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.boolean(),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    tags: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [z.string(), z.array(z.string())];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    warn_if: z.string().optional(),
                  })
                  .describe(
                    "Configurations set here will override configs set in dbt_project.yml.",
                  )
                  .optional(),
                field: z
                  .string()
                  .describe("The foreign key column")
                  .default("<FOREIGN_KEY_COLUMN>"),
                to: z.string().default("ref('')"),
                where: z.string().optional(),
              })
              .optional(),
          }),
          z.object({
            accepted_values: z
              .object({
                name: z.string().optional(),
                config: z
                  .object({
                    alias: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    database: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    enabled: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.boolean(),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    error_if: z.string().optional(),
                    fail_calc: z.string().optional(),
                    limit: z.number().optional(),
                    schema: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    severity: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.enum(["warn", "error"]),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    store_failures: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.boolean(),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    tags: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [z.string(), z.array(z.string())];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    warn_if: z.string().optional(),
                  })
                  .describe(
                    "Configurations set here will override configs set in dbt_project.yml.",
                  )
                  .optional(),
                quote: z.boolean().optional(),
                values: z.array(z.string()),
                where: z.string().optional(),
              })
              .optional(),
          }),
          z.object({
            not_null: z
              .object({
                name: z.string().optional(),
                config: z
                  .object({
                    alias: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    database: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    enabled: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.boolean(),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    error_if: z.string().optional(),
                    fail_calc: z.string().optional(),
                    limit: z.number().optional(),
                    schema: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    severity: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.enum(["warn", "error"]),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    store_failures: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.boolean(),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    tags: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [z.string(), z.array(z.string())];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    warn_if: z.string().optional(),
                  })
                  .describe(
                    "Configurations set here will override configs set in dbt_project.yml.",
                  )
                  .optional(),
                where: z.string().optional(),
              })
              .optional(),
          }),
          z.object({
            unique: z
              .object({
                name: z.string().optional(),
                config: z
                  .object({
                    alias: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    database: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    enabled: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.boolean(),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    error_if: z.string().optional(),
                    fail_calc: z.string().optional(),
                    limit: z.number().optional(),
                    schema: z
                      .string()
                      .describe("Only relevant when `store_failures` is true")
                      .optional(),
                    severity: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.enum(["warn", "error"]),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    store_failures: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [
                          z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                          z.boolean(),
                        ];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    tags: z
                      .any()
                      .superRefine((x, ctx) => {
                        const schemas = [z.string(), z.array(z.string())];
                        const errors = schemas.reduce(
                          (errors: z.ZodError[], schema) =>
                            ((result) =>
                              "error" in result
                                ? [...errors, result.error]
                                : errors)(schema.safeParse(x)),
                          [],
                        );
                        if (schemas.length - errors.length !== 1) {
                          ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                          });
                        }
                      })
                      .optional(),
                    warn_if: z.string().optional(),
                  })
                  .describe(
                    "Configurations set here will override configs set in dbt_project.yml.",
                  )
                  .optional(),
                where: z.string().optional(),
              })
              .optional(),
          }),
        ]),
      )
      .optional(),
  })
  .strict();

export const dbtSemanticModelsSchema = z
  .object({
    defaults: z
      .object({ agg_time_dimension: z.string().optional() })
      .strict()
      .optional(),
    description: z.string().optional(),
    dimensions: z
      .array(
        z
          .object({
            description: z.string().optional(),
            expr: z.union([z.string(), z.boolean()]).optional(),
            is_partition: z.boolean().optional(),
            name: z
              .string()
              .regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")),
            type: z.enum(["CATEGORICAL", "TIME", "categorical", "time"]),
            type_params: z
              .object({
                time_granularity: z.enum([
                  "DAY",
                  "WEEK",
                  "MONTH",
                  "QUARTER",
                  "YEAR",
                  "day",
                  "week",
                  "month",
                  "quarter",
                  "year",
                ]),
                validity_params: z
                  .object({
                    is_end: z.boolean().optional(),
                    is_start: z.boolean().optional(),
                  })
                  .strict()
                  .optional(),
              })
              .strict()
              .optional(),
          })
          .strict()
          .and(
            z.union([
              z
                .any()
                .refine(
                  (value) => !z.any().safeParse(value).success,
                  "Invalid input: Should NOT be valid against schema",
                ),
              z.any(),
            ]),
          ),
      )
      .optional(),
    entities: z
      .array(
        z
          .object({
            entity: z.string().optional(),
            expr: z.union([z.string(), z.boolean()]).optional(),
            name: z
              .string()
              .regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")),
            role: z.string().optional(),
            type: z.enum([
              "PRIMARY",
              "UNIQUE",
              "FOREIGN",
              "NATURAL",
              "primary",
              "unique",
              "foreign",
              "natural",
            ]),
          })
          .strict(),
      )
      .optional(),
    measures: z
      .array(
        z
          .object({
            agg: z.enum([
              "SUM",
              "MIN",
              "MAX",
              "AVERAGE",
              "COUNT_DISTINCT",
              "SUM_BOOLEAN",
              "COUNT",
              "PERCENTILE",
              "MEDIAN",
              "sum",
              "min",
              "max",
              "average",
              "count_distinct",
              "sum_boolean",
              "count",
              "percentile",
              "median",
            ]),
            agg_params: z
              .object({
                percentile: z.number().optional(),
                use_approximate_percentile: z.boolean().optional(),
                use_discrete_percentile: z.boolean().optional(),
              })
              .strict()
              .optional(),
            agg_time_dimension: z
              .string()
              .regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$"))
              .optional(),
            create_metric: z.boolean().optional(),
            create_metric_display_name: z.string().optional(),
            description: z.string().optional(),
            expr: z
              .union([z.string(), z.number().int(), z.boolean()])
              .optional(),
            name: z
              .string()
              .regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")),
            non_additive_dimension: z
              .object({
                name: z.string(),
                window_choice: z.enum(["MIN", "MAX", "min", "max"]).optional(),
                window_groupings: z.array(z.string()).optional(),
              })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .optional(),
    model: z.string().default("ref('')"),
    name: z.string().regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")),
    primary_entity: z.string().optional(),
  })
  .strict();

export const dbtSnapshotSchema = z.object({
  name: z.string(),
  columns: z
    .array(
      z
        .object({
          name: z.string(),
          constraints: z
            .array(
              z.object({
                columns: z
                  .any()
                  .superRefine((x, ctx) => {
                    const schemas = [z.string(), z.array(z.string())];
                    const errors = schemas.reduce(
                      (errors: z.ZodError[], schema) =>
                        ((result) =>
                          "error" in result
                            ? [...errors, result.error]
                            : errors)(schema.safeParse(x)),
                      [],
                    );
                    if (schemas.length - errors.length !== 1) {
                      ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                      });
                    }
                  })
                  .optional(),
                expression: z.string().optional(),
                name: z.string().optional(),
                type: z.string(),
                warn_unenforced: z
                  .any()
                  .superRefine((x, ctx) => {
                    const schemas = [
                      z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                      z.boolean(),
                    ];
                    const errors = schemas.reduce(
                      (errors: z.ZodError[], schema) =>
                        ((result) =>
                          "error" in result
                            ? [...errors, result.error]
                            : errors)(schema.safeParse(x)),
                      [],
                    );
                    if (schemas.length - errors.length !== 1) {
                      ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                      });
                    }
                  })
                  .optional(),
                warn_unsupported: z
                  .any()
                  .superRefine((x, ctx) => {
                    const schemas = [
                      z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                      z.boolean(),
                    ];
                    const errors = schemas.reduce(
                      (errors: z.ZodError[], schema) =>
                        ((result) =>
                          "error" in result
                            ? [...errors, result.error]
                            : errors)(schema.safeParse(x)),
                      [],
                    );
                    if (schemas.length - errors.length !== 1) {
                      ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                      });
                    }
                  })
                  .optional(),
              }),
            )
            .optional(),
          data_type: z.string().optional(),
          description: z.string().optional(),
          meta: z.record(z.any()).optional(),
          policy_tags: z
            .array(z.string())
            .describe(
              "Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.",
            )
            .optional(),
          quote: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [
                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                z.boolean(),
              ];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) =>
                    "error" in result ? [...errors, result.error] : errors)(
                    schema.safeParse(x),
                  ),
                [],
              );
              if (schemas.length - errors.length !== 1) {
                ctx.addIssue({
                  path: ctx.path,
                  code: "invalid_union",
                  unionErrors: errors,
                  message: "Invalid input: Should pass single schema",
                });
              }
            })
            .optional(),
          tests: z
            .array(
              z.union([
                z.string(),
                z.object({
                  relationships: z
                    .object({
                      name: z.string().optional(),
                      config: z
                        .object({
                          alias: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          database: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          enabled: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          error_if: z.string().optional(),
                          fail_calc: z.string().optional(),
                          limit: z.number().optional(),
                          schema: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          severity: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.enum(["warn", "error"]),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          store_failures: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          tags: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string(), z.array(z.string())];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          warn_if: z.string().optional(),
                        })
                        .describe(
                          "Configurations set here will override configs set in dbt_project.yml.",
                        )
                        .optional(),
                      field: z
                        .string()
                        .describe("The foreign key column")
                        .default("<FOREIGN_KEY_COLUMN>"),
                      to: z.string().default("ref('')"),
                      where: z.string().optional(),
                    })
                    .optional(),
                }),
                z.object({
                  accepted_values: z
                    .object({
                      name: z.string().optional(),
                      config: z
                        .object({
                          alias: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          database: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          enabled: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          error_if: z.string().optional(),
                          fail_calc: z.string().optional(),
                          limit: z.number().optional(),
                          schema: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          severity: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.enum(["warn", "error"]),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          store_failures: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          tags: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string(), z.array(z.string())];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          warn_if: z.string().optional(),
                        })
                        .describe(
                          "Configurations set here will override configs set in dbt_project.yml.",
                        )
                        .optional(),
                      quote: z.boolean().optional(),
                      values: z.array(z.string()),
                      where: z.string().optional(),
                    })
                    .optional(),
                }),
                z.object({
                  not_null: z
                    .object({
                      name: z.string().optional(),
                      config: z
                        .object({
                          alias: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          database: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          enabled: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          error_if: z.string().optional(),
                          fail_calc: z.string().optional(),
                          limit: z.number().optional(),
                          schema: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          severity: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.enum(["warn", "error"]),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          store_failures: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          tags: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string(), z.array(z.string())];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          warn_if: z.string().optional(),
                        })
                        .describe(
                          "Configurations set here will override configs set in dbt_project.yml.",
                        )
                        .optional(),
                      where: z.string().optional(),
                    })
                    .optional(),
                }),
                z.object({
                  unique: z
                    .object({
                      name: z.string().optional(),
                      config: z
                        .object({
                          alias: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          database: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          enabled: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          error_if: z.string().optional(),
                          fail_calc: z.string().optional(),
                          limit: z.number().optional(),
                          schema: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          severity: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.enum(["warn", "error"]),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          store_failures: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          tags: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string(), z.array(z.string())];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          warn_if: z.string().optional(),
                        })
                        .describe(
                          "Configurations set here will override configs set in dbt_project.yml.",
                        )
                        .optional(),
                      where: z.string().optional(),
                    })
                    .optional(),
                }),
              ]),
            )
            .optional(),
          tags: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [z.string(), z.array(z.string())];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) =>
                    "error" in result ? [...errors, result.error] : errors)(
                    schema.safeParse(x),
                  ),
                [],
              );
              if (schemas.length - errors.length !== 1) {
                ctx.addIssue({
                  path: ctx.path,
                  code: "invalid_union",
                  unionErrors: errors,
                  message: "Invalid input: Should pass single schema",
                });
              }
            })
            .optional(),
        })
        .strict(),
    )
    .optional(),
  config: z
    .object({
      alias: z.string().optional(),
      check_cols: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
      enabled: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [
            z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
            z.boolean(),
          ];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
      grants: z
        .record(
          z.union([
            z.any().superRefine((x, ctx) => {
              const schemas = [z.string(), z.array(z.string())];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) =>
                    "error" in result ? [...errors, result.error] : errors)(
                    schema.safeParse(x),
                  ),
                [],
              );
              if (schemas.length - errors.length !== 1) {
                ctx.addIssue({
                  path: ctx.path,
                  code: "invalid_union",
                  unionErrors: errors,
                  message: "Invalid input: Should pass single schema",
                });
              }
            }),
            z.never(),
          ]),
        )
        .superRefine((value, ctx) => {
          for (const key in value) {
            let evaluated = false;
            if (key.match(new RegExp(".*"))) {
              evaluated = true;
              const result = z
                .any()
                .superRefine((x, ctx) => {
                  const schemas = [z.string(), z.array(z.string())];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) =>
                        "error" in result ? [...errors, result.error] : errors)(
                        schema.safeParse(x),
                      ),
                    [],
                  );
                  if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                      path: ctx.path,
                      code: "invalid_union",
                      unionErrors: errors,
                      message: "Invalid input: Should pass single schema",
                    });
                  }
                })
                .safeParse(value[key]);
              if (!result.success) {
                ctx.addIssue({
                  path: [...ctx.path, key],
                  code: "custom",
                  message: `Invalid input: Key matching regex /${key}/ must match schema`,
                  params: {
                    issues: result.error.issues,
                  },
                });
              }
            }
            if (!evaluated) {
              const result = z.never().safeParse(value[key]);
              if (!result.success) {
                ctx.addIssue({
                  path: [...ctx.path, key],
                  code: "custom",
                  message: `Invalid input: must match catchall schema`,
                  params: {
                    issues: result.error.issues,
                  },
                });
              }
            }
          }
        })
        .describe(
          "grant config. each key is a database permission and the value is the grantee of that permission",
        )
        .optional(),
      persist_docs: z
        .object({
          columns: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [
                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                z.boolean(),
              ];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) =>
                    "error" in result ? [...errors, result.error] : errors)(
                    schema.safeParse(x),
                  ),
                [],
              );
              if (schemas.length - errors.length !== 1) {
                ctx.addIssue({
                  path: ctx.path,
                  code: "invalid_union",
                  unionErrors: errors,
                  message: "Invalid input: Should pass single schema",
                });
              }
            })
            .optional(),
          relation: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [
                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                z.boolean(),
              ];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) =>
                    "error" in result ? [...errors, result.error] : errors)(
                    schema.safeParse(x),
                  ),
                [],
              );
              if (schemas.length - errors.length !== 1) {
                ctx.addIssue({
                  path: ctx.path,
                  code: "invalid_union",
                  unionErrors: errors,
                  message: "Invalid input: Should pass single schema",
                });
              }
            })
            .optional(),
        })
        .strict()
        .describe(
          "Configurations for the persistence of the dbt documentation.",
        )
        .optional(),
      "post-hook": z.array(z.string()).optional(),
      "pre-hook": z.array(z.string()).optional(),
      quote_columns: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [
            z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
            z.boolean(),
          ];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
      strategy: z.string().optional(),
      tags: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
      target_database: z.string().optional(),
      target_schema: z.string().optional(),
      unique_key: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
      updated_at: z.string().optional(),
    })
    .optional(),
  description: z.string().optional(),
  docs: z
    .object({
      node_color: z
        .string()
        .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
        .describe(
          "The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.",
        )
        .optional(),
      show: z.boolean().default(true),
    })
    .strict()
    .describe(
      "Configurations for the appearance of nodes in the dbt documentation.",
    )
    .optional(),
  group: z.string().optional(),
  meta: z.record(z.any()).optional(),
  tests: z
    .array(
      z.union([
        z.string(),
        z.object({
          relationships: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              field: z
                .string()
                .describe("The foreign key column")
                .default("<FOREIGN_KEY_COLUMN>"),
              to: z.string().default("ref('')"),
              where: z.string().optional(),
            })
            .optional(),
        }),
        z.object({
          accepted_values: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              quote: z.boolean().optional(),
              values: z.array(z.string()),
              where: z.string().optional(),
            })
            .optional(),
        }),
        z.object({
          not_null: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              where: z.string().optional(),
            })
            .optional(),
        }),
        z.object({
          unique: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              where: z.string().optional(),
            })
            .optional(),
        }),
      ]),
    )
    .optional(),
});

export const dbtSourceSchema = z.object({
  name: z
    .string()
    .describe(
      "How you will identify the schema in {{ source() }} calls. Unless `schema` is also set, this will be the name of the schema in the database.",
    ),
  config: z.record(z.any()).optional(),
  database: z.string().optional(),
  description: z.string().optional(),
  freshness: z
    .any()
    .superRefine((x, ctx) => {
      const schemas = [
        z
          .object({
            error_after: z
              .object({
                count: z.any().superRefine((x, ctx) => {
                  const schemas = [
                    z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                    z.number(),
                  ];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) =>
                        "error" in result ? [...errors, result.error] : errors)(
                        schema.safeParse(x),
                      ),
                    [],
                  );
                  if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                      path: ctx.path,
                      code: "invalid_union",
                      unionErrors: errors,
                      message: "Invalid input: Should pass single schema",
                    });
                  }
                }),
                period: z.enum(["minute", "hour", "day"]),
              })
              .strict()
              .optional(),
            filter: z.string().optional(),
            warn_after: z
              .object({
                count: z.any().superRefine((x, ctx) => {
                  const schemas = [
                    z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                    z.number(),
                  ];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) =>
                        "error" in result ? [...errors, result.error] : errors)(
                        schema.safeParse(x),
                      ),
                    [],
                  );
                  if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                      path: ctx.path,
                      code: "invalid_union",
                      unionErrors: errors,
                      message: "Invalid input: Should pass single schema",
                    });
                  }
                }),
                period: z.enum(["minute", "hour", "day"]),
              })
              .strict()
              .optional(),
          })
          .strict(),
        z.literal(null),
      ];
      const errors = schemas.reduce(
        (errors: z.ZodError[], schema) =>
          ((result) =>
            "error" in result ? [...errors, result.error] : errors)(
            schema.safeParse(x),
          ),
        [],
      );
      if (schemas.length - errors.length !== 1) {
        ctx.addIssue({
          path: ctx.path,
          code: "invalid_union",
          unionErrors: errors,
          message: "Invalid input: Should pass single schema",
        });
      }
    })
    .default({
      warn_after: { count: 1, period: "day" },
      error_after: { count: 2, period: "day" },
    }),
  loaded_at_field: z.string().optional(),
  loader: z.string().optional(),
  meta: z.record(z.any()).optional(),
  overrides: z
    .string()
    .describe(
      "The name of another package installed in your project. If that package has a source with the same name as this one, its properties will be applied on top of the base properties of the overridden source. https://docs.getdbt.com/reference/resource-properties/overrides",
    )
    .optional(),
  quoting: z
    .object({
      database: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [
            z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
            z.boolean(),
          ];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
      identifier: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [
            z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
            z.boolean(),
          ];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
      schema: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [
            z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
            z.boolean(),
          ];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) =>
                "error" in result ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
            [],
          );
          if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
              path: ctx.path,
              code: "invalid_union",
              unionErrors: errors,
              message: "Invalid input: Should pass single schema",
            });
          }
        })
        .optional(),
    })
    .strict()
    .optional(),
  schema: z
    .string()
    .describe(
      "The schema name as stored in the database. Only needed if you want to use a different `name` than what exists in the database (otherwise `name` is used by default)",
    )
    .optional(),
  tables: z
    .array(
      z
        .object({
          name: z
            .string()
            .describe(
              "How you will identify the table in {{ source() }} calls. Unless `identifier` is also set, this will be the name of the table in the database.",
            ),
          columns: z
            .array(
              z
                .object({
                  name: z.string(),
                  constraints: z
                    .array(
                      z.object({
                        columns: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [z.string(), z.array(z.string())];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        expression: z.string().optional(),
                        name: z.string().optional(),
                        type: z.string(),
                        warn_unenforced: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                        warn_unsupported: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [
                              z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                              z.boolean(),
                            ];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) =>
                                  "error" in result
                                    ? [...errors, result.error]
                                    : errors)(schema.safeParse(x)),
                              [],
                            );
                            if (schemas.length - errors.length !== 1) {
                              ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message:
                                  "Invalid input: Should pass single schema",
                              });
                            }
                          })
                          .optional(),
                      }),
                    )
                    .optional(),
                  data_type: z.string().optional(),
                  description: z.string().optional(),
                  meta: z.record(z.any()).optional(),
                  policy_tags: z
                    .array(z.string())
                    .describe(
                      "Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.",
                    )
                    .optional(),
                  quote: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tests: z
                    .array(
                      z.union([
                        z.string(),
                        z.object({
                          relationships: z
                            .object({
                              name: z.string().optional(),
                              config: z
                                .object({
                                  alias: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  database: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  enabled: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  error_if: z.string().optional(),
                                  fail_calc: z.string().optional(),
                                  limit: z.number().optional(),
                                  schema: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  severity: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.enum(["warn", "error"]),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  store_failures: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  tags: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z.string(),
                                        z.array(z.string()),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  warn_if: z.string().optional(),
                                })
                                .describe(
                                  "Configurations set here will override configs set in dbt_project.yml.",
                                )
                                .optional(),
                              field: z
                                .string()
                                .describe("The foreign key column")
                                .default("<FOREIGN_KEY_COLUMN>"),
                              to: z.string().default("ref('')"),
                              where: z.string().optional(),
                            })
                            .optional(),
                        }),
                        z.object({
                          accepted_values: z
                            .object({
                              name: z.string().optional(),
                              config: z
                                .object({
                                  alias: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  database: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  enabled: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  error_if: z.string().optional(),
                                  fail_calc: z.string().optional(),
                                  limit: z.number().optional(),
                                  schema: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  severity: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.enum(["warn", "error"]),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  store_failures: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  tags: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z.string(),
                                        z.array(z.string()),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  warn_if: z.string().optional(),
                                })
                                .describe(
                                  "Configurations set here will override configs set in dbt_project.yml.",
                                )
                                .optional(),
                              quote: z.boolean().optional(),
                              values: z.array(z.string()),
                              where: z.string().optional(),
                            })
                            .optional(),
                        }),
                        z.object({
                          not_null: z
                            .object({
                              name: z.string().optional(),
                              config: z
                                .object({
                                  alias: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  database: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  enabled: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  error_if: z.string().optional(),
                                  fail_calc: z.string().optional(),
                                  limit: z.number().optional(),
                                  schema: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  severity: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.enum(["warn", "error"]),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  store_failures: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  tags: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z.string(),
                                        z.array(z.string()),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  warn_if: z.string().optional(),
                                })
                                .describe(
                                  "Configurations set here will override configs set in dbt_project.yml.",
                                )
                                .optional(),
                              where: z.string().optional(),
                            })
                            .optional(),
                        }),
                        z.object({
                          unique: z
                            .object({
                              name: z.string().optional(),
                              config: z
                                .object({
                                  alias: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  database: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  enabled: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  error_if: z.string().optional(),
                                  fail_calc: z.string().optional(),
                                  limit: z.number().optional(),
                                  schema: z
                                    .string()
                                    .describe(
                                      "Only relevant when `store_failures` is true",
                                    )
                                    .optional(),
                                  severity: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.enum(["warn", "error"]),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  store_failures: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z
                                          .string()
                                          .regex(new RegExp("\\{\\{.*\\}\\}")),
                                        z.boolean(),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  tags: z
                                    .any()
                                    .superRefine((x, ctx) => {
                                      const schemas = [
                                        z.string(),
                                        z.array(z.string()),
                                      ];
                                      const errors = schemas.reduce(
                                        (errors: z.ZodError[], schema) =>
                                          ((result) =>
                                            "error" in result
                                              ? [...errors, result.error]
                                              : errors)(schema.safeParse(x)),
                                        [],
                                      );
                                      if (
                                        schemas.length - errors.length !==
                                        1
                                      ) {
                                        ctx.addIssue({
                                          path: ctx.path,
                                          code: "invalid_union",
                                          unionErrors: errors,
                                          message:
                                            "Invalid input: Should pass single schema",
                                        });
                                      }
                                    })
                                    .optional(),
                                  warn_if: z.string().optional(),
                                })
                                .describe(
                                  "Configurations set here will override configs set in dbt_project.yml.",
                                )
                                .optional(),
                              where: z.string().optional(),
                            })
                            .optional(),
                        }),
                      ]),
                    )
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                })
                .strict(),
            )
            .optional(),
          description: z.string().optional(),
          external: z.record(z.any()).optional(),
          freshness: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [
                z
                  .object({
                    error_after: z
                      .object({
                        count: z.any().superRefine((x, ctx) => {
                          const schemas = [
                            z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                            z.number(),
                          ];
                          const errors = schemas.reduce(
                            (errors: z.ZodError[], schema) =>
                              ((result) =>
                                "error" in result
                                  ? [...errors, result.error]
                                  : errors)(schema.safeParse(x)),
                            [],
                          );
                          if (schemas.length - errors.length !== 1) {
                            ctx.addIssue({
                              path: ctx.path,
                              code: "invalid_union",
                              unionErrors: errors,
                              message:
                                "Invalid input: Should pass single schema",
                            });
                          }
                        }),
                        period: z.enum(["minute", "hour", "day"]),
                      })
                      .strict()
                      .optional(),
                    filter: z.string().optional(),
                    warn_after: z
                      .object({
                        count: z.any().superRefine((x, ctx) => {
                          const schemas = [
                            z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                            z.number(),
                          ];
                          const errors = schemas.reduce(
                            (errors: z.ZodError[], schema) =>
                              ((result) =>
                                "error" in result
                                  ? [...errors, result.error]
                                  : errors)(schema.safeParse(x)),
                            [],
                          );
                          if (schemas.length - errors.length !== 1) {
                            ctx.addIssue({
                              path: ctx.path,
                              code: "invalid_union",
                              unionErrors: errors,
                              message:
                                "Invalid input: Should pass single schema",
                            });
                          }
                        }),
                        period: z.enum(["minute", "hour", "day"]),
                      })
                      .strict()
                      .optional(),
                  })
                  .strict(),
                z.literal(null),
              ];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) =>
                    "error" in result ? [...errors, result.error] : errors)(
                    schema.safeParse(x),
                  ),
                [],
              );
              if (schemas.length - errors.length !== 1) {
                ctx.addIssue({
                  path: ctx.path,
                  code: "invalid_union",
                  unionErrors: errors,
                  message: "Invalid input: Should pass single schema",
                });
              }
            })
            .default({
              warn_after: { count: 1, period: "day" },
              error_after: { count: 2, period: "day" },
            }),
          identifier: z
            .string()
            .describe(
              "The table name as stored in the database. Only needed if you want to give the source a different name than what exists in the database (otherwise `name` is used by default)",
            )
            .optional(),
          loaded_at_field: z
            .string()
            .describe(
              "Which column to check during data freshness tests. Only needed if the table has a different loaded_at_field to the one defined on the source overall.",
            )
            .optional(),
          loader: z.string().optional(),
          meta: z.record(z.any()).optional(),
          quoting: z
            .object({
              database: z
                .any()
                .superRefine((x, ctx) => {
                  const schemas = [
                    z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                    z.boolean(),
                  ];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) =>
                        "error" in result ? [...errors, result.error] : errors)(
                        schema.safeParse(x),
                      ),
                    [],
                  );
                  if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                      path: ctx.path,
                      code: "invalid_union",
                      unionErrors: errors,
                      message: "Invalid input: Should pass single schema",
                    });
                  }
                })
                .optional(),
              identifier: z
                .any()
                .superRefine((x, ctx) => {
                  const schemas = [
                    z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                    z.boolean(),
                  ];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) =>
                        "error" in result ? [...errors, result.error] : errors)(
                        schema.safeParse(x),
                      ),
                    [],
                  );
                  if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                      path: ctx.path,
                      code: "invalid_union",
                      unionErrors: errors,
                      message: "Invalid input: Should pass single schema",
                    });
                  }
                })
                .optional(),
              schema: z
                .any()
                .superRefine((x, ctx) => {
                  const schemas = [
                    z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                    z.boolean(),
                  ];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) =>
                        "error" in result ? [...errors, result.error] : errors)(
                        schema.safeParse(x),
                      ),
                    [],
                  );
                  if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                      path: ctx.path,
                      code: "invalid_union",
                      unionErrors: errors,
                      message: "Invalid input: Should pass single schema",
                    });
                  }
                })
                .optional(),
            })
            .strict()
            .optional(),
          tags: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [z.string(), z.array(z.string())];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) =>
                    "error" in result ? [...errors, result.error] : errors)(
                    schema.safeParse(x),
                  ),
                [],
              );
              if (schemas.length - errors.length !== 1) {
                ctx.addIssue({
                  path: ctx.path,
                  code: "invalid_union",
                  unionErrors: errors,
                  message: "Invalid input: Should pass single schema",
                });
              }
            })
            .optional(),
          tests: z
            .array(
              z.union([
                z.string(),
                z.object({
                  relationships: z
                    .object({
                      name: z.string().optional(),
                      config: z
                        .object({
                          alias: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          database: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          enabled: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          error_if: z.string().optional(),
                          fail_calc: z.string().optional(),
                          limit: z.number().optional(),
                          schema: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          severity: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.enum(["warn", "error"]),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          store_failures: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          tags: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string(), z.array(z.string())];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          warn_if: z.string().optional(),
                        })
                        .describe(
                          "Configurations set here will override configs set in dbt_project.yml.",
                        )
                        .optional(),
                      field: z
                        .string()
                        .describe("The foreign key column")
                        .default("<FOREIGN_KEY_COLUMN>"),
                      to: z.string().default("ref('')"),
                      where: z.string().optional(),
                    })
                    .optional(),
                }),
                z.object({
                  accepted_values: z
                    .object({
                      name: z.string().optional(),
                      config: z
                        .object({
                          alias: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          database: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          enabled: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          error_if: z.string().optional(),
                          fail_calc: z.string().optional(),
                          limit: z.number().optional(),
                          schema: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          severity: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.enum(["warn", "error"]),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          store_failures: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          tags: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string(), z.array(z.string())];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          warn_if: z.string().optional(),
                        })
                        .describe(
                          "Configurations set here will override configs set in dbt_project.yml.",
                        )
                        .optional(),
                      quote: z.boolean().optional(),
                      values: z.array(z.string()),
                      where: z.string().optional(),
                    })
                    .optional(),
                }),
                z.object({
                  not_null: z
                    .object({
                      name: z.string().optional(),
                      config: z
                        .object({
                          alias: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          database: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          enabled: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          error_if: z.string().optional(),
                          fail_calc: z.string().optional(),
                          limit: z.number().optional(),
                          schema: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          severity: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.enum(["warn", "error"]),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          store_failures: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          tags: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string(), z.array(z.string())];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          warn_if: z.string().optional(),
                        })
                        .describe(
                          "Configurations set here will override configs set in dbt_project.yml.",
                        )
                        .optional(),
                      where: z.string().optional(),
                    })
                    .optional(),
                }),
                z.object({
                  unique: z
                    .object({
                      name: z.string().optional(),
                      config: z
                        .object({
                          alias: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          database: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          enabled: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          error_if: z.string().optional(),
                          fail_calc: z.string().optional(),
                          limit: z.number().optional(),
                          schema: z
                            .string()
                            .describe(
                              "Only relevant when `store_failures` is true",
                            )
                            .optional(),
                          severity: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.enum(["warn", "error"]),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          store_failures: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [
                                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                z.boolean(),
                              ];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          tags: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string(), z.array(z.string())];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) =>
                                    "error" in result
                                      ? [...errors, result.error]
                                      : errors)(schema.safeParse(x)),
                                [],
                              );
                              if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                  path: ctx.path,
                                  code: "invalid_union",
                                  unionErrors: errors,
                                  message:
                                    "Invalid input: Should pass single schema",
                                });
                              }
                            })
                            .optional(),
                          warn_if: z.string().optional(),
                        })
                        .describe(
                          "Configurations set here will override configs set in dbt_project.yml.",
                        )
                        .optional(),
                      where: z.string().optional(),
                    })
                    .optional(),
                }),
              ]),
            )
            .optional(),
        })
        .strict(),
    )
    .optional(),
  tags: z
    .any()
    .superRefine((x, ctx) => {
      const schemas = [z.string(), z.array(z.string())];
      const errors = schemas.reduce(
        (errors: z.ZodError[], schema) =>
          ((result) =>
            "error" in result ? [...errors, result.error] : errors)(
            schema.safeParse(x),
          ),
        [],
      );
      if (schemas.length - errors.length !== 1) {
        ctx.addIssue({
          path: ctx.path,
          code: "invalid_union",
          unionErrors: errors,
          message: "Invalid input: Should pass single schema",
        });
      }
    })
    .optional(),
  tests: z
    .array(
      z.union([
        z.string(),
        z.object({
          relationships: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              field: z
                .string()
                .describe("The foreign key column")
                .default("<FOREIGN_KEY_COLUMN>"),
              to: z.string().default("ref('')"),
              where: z.string().optional(),
            })
            .optional(),
        }),
        z.object({
          accepted_values: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              quote: z.boolean().optional(),
              values: z.array(z.string()),
              where: z.string().optional(),
            })
            .optional(),
        }),
        z.object({
          not_null: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              where: z.string().optional(),
            })
            .optional(),
        }),
        z.object({
          unique: z
            .object({
              name: z.string().optional(),
              config: z
                .object({
                  alias: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  database: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  enabled: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  error_if: z.string().optional(),
                  fail_calc: z.string().optional(),
                  limit: z.number().optional(),
                  schema: z
                    .string()
                    .describe("Only relevant when `store_failures` is true")
                    .optional(),
                  severity: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.enum(["warn", "error"]),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  store_failures: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [
                        z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                        z.boolean(),
                      ];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  tags: z
                    .any()
                    .superRefine((x, ctx) => {
                      const schemas = [z.string(), z.array(z.string())];
                      const errors = schemas.reduce(
                        (errors: z.ZodError[], schema) =>
                          ((result) =>
                            "error" in result
                              ? [...errors, result.error]
                              : errors)(schema.safeParse(x)),
                        [],
                      );
                      if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                          path: ctx.path,
                          code: "invalid_union",
                          unionErrors: errors,
                          message: "Invalid input: Should pass single schema",
                        });
                      }
                    })
                    .optional(),
                  warn_if: z.string().optional(),
                })
                .describe(
                  "Configurations set here will override configs set in dbt_project.yml.",
                )
                .optional(),
              where: z.string().optional(),
            })
            .optional(),
        }),
      ]),
    )
    .optional(),
});

export const dbtPropertySchema = z.object({
  version: z.literal(2).optional(),
  analyses: z.array(dbtAnalysisSchema).optional(),
  exposures: z.array(dbtExposureSchema).optional(),
  groups: z.array(dbtGroupsSchema).optional(),
  macros: z.array(dbtMacroSchema).optional(),
  metrics: z.array(dbtMetricSchema).optional(),
  models: z.array(dbtModelsSchema).optional(),
  seeds: z.array(dbtSeedsSchema).optional(),
  semantic_models: z.array(dbtSemanticModelsSchema).optional(),
  snapshots: z.array(dbtSnapshotSchema).optional(),
  sources: z.array(dbtSourceSchema).optional(),
  meta: z.any(),
});
