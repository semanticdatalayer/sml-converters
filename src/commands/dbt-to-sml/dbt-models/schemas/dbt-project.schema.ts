import { z } from "zod";

// generated based on https://raw.githubusercontent.com/dbt-labs/dbt-jsonschema/main/schemas/dbt_project.json
export const dbtProjectSchema = z.object({
  version: z.string().optional(),
  name: z.string(),
  "analysis-paths": z.array(z.string()).optional(),
  "asset-paths": z.array(z.string()).optional(),
  "clean-targets": z.array(z.string()).optional(),
  "config-version": z.number().default(2),
  dispatch: z
    .array(
      z.object({
        macro_namespace: z.string(),
        search_order: z.array(z.string()),
      })
    )
    .optional(),
  "docs-paths": z.array(z.string()).optional(),
  "log-path": z.string().optional(),
  "macro-paths": z.array(z.string()).optional(),
  metrics: z
    .object({
      "+enabled": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+treat_null_values_as_zero": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      treat_null_values_as_zero: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
    .catchall(
      z.any().superRefine((x, ctx) => {
        const schemas = [z.any(), z.null()];
        const errors = schemas.reduce(
          (errors: z.ZodError[], schema) =>
            ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
          []
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
    )
    .describe(
      "Configurations set in the dbt_project.yml file will apply to all metrics that don't have a more specific configuration set."
    )
    .optional(),
  "model-paths": z.array(z.string()).optional(),
  models: z
    .object({
      "+alias": z.string().optional(),
      "+bind": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+contract": z
        .object({
          enforced: z.any().superRefine((x, ctx) => {
            const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
            const errors = schemas.reduce(
              (errors: z.ZodError[], schema) =>
                ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
              []
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
        })
        .optional(),
      "+copy_grants": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+database": z.string().optional(),
      "+docs": z
        .object({
          node_color: z
            .string()
            .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
            .describe(
              "The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name."
            )
            .optional(),
          show: z.boolean().default(true),
        })
        .describe("Configurations for the appearance of nodes in the dbt documentation.")
        .optional(),
      "+enabled": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+file_format": z.string().optional(),
      "+grant_access_to": z
        .array(
          z.object({
            dataset: z.string().optional(),
            project: z.string().optional(),
          })
        )
        .describe("Configuration, specific to BigQuery adapter, used to setup authorized views.")
        .optional(),
      "+grants": z
        .record(
          z.union([
            z.any().superRefine((x, ctx) => {
              const schemas = [z.string(), z.array(z.string())];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
          ])
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
                      ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                    []
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
        .describe("grant config. each key is a database permission and the value is the grantee of that permission")
        .optional(),
      "+hours_to_expiration": z
        .number()
        .describe("Configuration specific to BigQuery adapter used to set an expiration delay (in hours) to a table.")
        .optional(),
      "+incremental_strategy": z.string().optional(),
      "+kms_key_name": z
        .string()
        .describe("Configuration, specific to BigQuery adapter, of the KMS key name used for data encryption.")
        .optional(),
      "+labels": z
        .record(
          z.union([
            z.any().superRefine((x, ctx) => {
              const schemas = [
                z.string().regex(new RegExp("^[a-z0-9_-]{0,64}$")),
                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
              ];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
          ])
        )
        .superRefine((value, ctx) => {
          for (const key in value) {
            let evaluated = false;
            if (key.match(new RegExp("^[a-z][a-z0-9_-]{0,63}$"))) {
              evaluated = true;
              const result = z
                .any()
                .superRefine((x, ctx) => {
                  const schemas = [
                    z.string().regex(new RegExp("^[a-z0-9_-]{0,64}$")),
                    z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                  ];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                    []
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
          "Configurations specific to BigQuery adapter used to add labels and tags to tables & views created by dbt."
        )
        .optional(),
      "+location": z.string().optional(),
      "+materialized": z.string().optional(),
      "+meta": z.record(z.any()).optional(),
      "+on_schema_change": z.enum(["append_new_columns", "fail", "ignore", "sync_all_columns"]).optional(),
      "+persist_docs": z
        .object({
          columns: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
        .describe("Configurations for the persistence of the dbt documentation.")
        .optional(),
      "+post-hook": z.array(z.string()).optional(),
      "+pre-hook": z.array(z.string()).optional(),
      "+schema": z.union([z.string(), z.null()]).optional(),
      "+sql_header": z.string().optional(),
      "+tags": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+transient": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      alias: z.string().optional(),
      bind: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
          enforced: z.any().superRefine((x, ctx) => {
            const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
            const errors = schemas.reduce(
              (errors: z.ZodError[], schema) =>
                ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
              []
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
        })
        .optional(),
      copy_grants: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      docs: z
        .object({
          node_color: z
            .string()
            .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
            .describe(
              "The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name."
            )
            .optional(),
          show: z.boolean().default(true),
        })
        .describe("Configurations for the appearance of nodes in the dbt documentation.")
        .optional(),
      enabled: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      file_format: z.string().optional(),
      grant_access_to: z
        .array(
          z.object({
            dataset: z.string().optional(),
            project: z.string().optional(),
          })
        )
        .describe("Configuration, specific to BigQuery adapter, used to setup authorized views.")
        .optional(),
      grants: z
        .record(
          z.union([
            z.any().superRefine((x, ctx) => {
              const schemas = [z.string(), z.array(z.string())];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
          ])
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
                      ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                    []
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
        .describe("grant config. each key is a database permission and the value is the grantee of that permission")
        .optional(),
      hours_to_expiration: z
        .number()
        .describe("Configuration specific to BigQuery adapter used to set an expiration delay (in hours) to a table.")
        .optional(),
      incremental_strategy: z.string().optional(),
      kms_key_name: z
        .string()
        .describe("Configuration, specific to BigQuery adapter, of the KMS key name used for data encryption.")
        .optional(),
      labels: z
        .record(
          z.union([
            z.any().superRefine((x, ctx) => {
              const schemas = [
                z.string().regex(new RegExp("^[a-z0-9_-]{0,64}$")),
                z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
              ];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
          ])
        )
        .superRefine((value, ctx) => {
          for (const key in value) {
            let evaluated = false;
            if (key.match(new RegExp("^[a-z][a-z0-9_-]{0,63}$"))) {
              evaluated = true;
              const result = z
                .any()
                .superRefine((x, ctx) => {
                  const schemas = [
                    z.string().regex(new RegExp("^[a-z0-9_-]{0,64}$")),
                    z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                  ];
                  const errors = schemas.reduce(
                    (errors: z.ZodError[], schema) =>
                      ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                    []
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
          "Configurations specific to BigQuery adapter used to add labels and tags to tables & views created by dbt."
        )
        .optional(),
      location: z.string().optional(),
      materialized: z.string().optional(),
      meta: z.record(z.any()).optional(),
      on_schema_change: z.enum(["append_new_columns", "fail", "ignore", "sync_all_columns"]).optional(),
      persist_docs: z
        .object({
          columns: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
        .describe("Configurations for the persistence of the dbt documentation.")
        .optional(),
      "post-hook": z.array(z.string()).optional(),
      "pre-hook": z.array(z.string()).optional(),
      schema: z.union([z.string(), z.null()]).optional(),
      sql_header: z.string().optional(),
      tags: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      transient: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
    .catchall(
      z.any().superRefine((x, ctx) => {
        const schemas = [z.any(), z.null()];
        const errors = schemas.reduce(
          (errors: z.ZodError[], schema) =>
            ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
          []
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
    )
    .describe(
      "Configurations set in the dbt_project.yml file will apply to all models that don't have a more specific configuration set."
    )
    .optional(),
  "on-run-end": z.union([z.array(z.string()), z.string()]).optional(),
  "on-run-start": z.union([z.array(z.string()), z.string()]).optional(),
  "packages-install-path": z.string().optional(),
  profile: z.string().optional(),
  "query-comment": z
    .any()
    .superRefine((x, ctx) => {
      const schemas = [
        z.string(),
        z.object({
          append: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
          comment: z.string().optional(),
          "job-label": z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
      ];
      const errors = schemas.reduce(
        (errors: z.ZodError[], schema) =>
          ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
        []
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
  quoting: z
    .object({
      database: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
  "require-dbt-version": z
    .any()
    .superRefine((x, ctx) => {
      const schemas = [z.string(), z.array(z.string())];
      const errors = schemas.reduce(
        (errors: z.ZodError[], schema) =>
          ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
        []
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
  "seed-paths": z.array(z.string()).optional(),
  seeds: z
    .object({
      "+copy_grants": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+database": z.string().optional(),
      "+enabled": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+grants": z
        .record(
          z.union([
            z.any().superRefine((x, ctx) => {
              const schemas = [z.string(), z.array(z.string())];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
          ])
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
                      ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                    []
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
        .describe("grant config. each key is a database permission and the value is the grantee of that permission")
        .optional(),
      "+meta": z.record(z.any()).optional(),
      "+persist_docs": z
        .object({
          columns: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
        .describe("Configurations for the persistence of the dbt documentation.")
        .optional(),
      "+quote_columns": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+schema": z.union([z.string(), z.null()]).optional(),
      "+tags": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+transient": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+column_types": z
        .record(z.string())
        .superRefine((value, ctx) => {
          for (const key in value) {
            if (key.match(new RegExp(""))) {
              const result = z.string().safeParse(value[key]);
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
          }
        })
        .optional(),
      "+full_refresh": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      copy_grants: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
          ])
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
                      ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                    []
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
        .describe("grant config. each key is a database permission and the value is the grantee of that permission")
        .optional(),
      meta: z.record(z.any()).optional(),
      persist_docs: z
        .object({
          columns: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
        .describe("Configurations for the persistence of the dbt documentation.")
        .optional(),
      quote_columns: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      transient: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      column_types: z
        .record(z.string())
        .superRefine((value, ctx) => {
          for (const key in value) {
            if (key.match(new RegExp(""))) {
              const result = z.string().safeParse(value[key]);
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
          }
        })
        .optional(),
      full_refresh: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      schema: z.union([z.string(), z.null()]).optional(),
    })
    .catchall(
      z.any().superRefine((x, ctx) => {
        const schemas = [z.any(), z.null()];
        const errors = schemas.reduce(
          (errors: z.ZodError[], schema) =>
            ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
          []
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
    )
    .optional(),
  "snapshot-paths": z.array(z.string()).optional(),
  snapshots: z
    .object({
      "+alias": z.string().optional(),
      "+check_cols": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+enabled": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+grants": z
        .record(
          z.union([
            z.any().superRefine((x, ctx) => {
              const schemas = [z.string(), z.array(z.string())];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
          ])
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
                      ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                    []
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
        .describe("grant config. each key is a database permission and the value is the grantee of that permission")
        .optional(),
      "+invalidate_hard_deletes": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+meta": z.record(z.any()).optional(),
      "+persist_docs": z
        .object({
          columns: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
        .describe("Configurations for the persistence of the dbt documentation.")
        .optional(),
      "+post-hook": z.array(z.string()).optional(),
      "+pre-hook": z.array(z.string()).optional(),
      "+quote_columns": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+strategy": z.string().optional(),
      "+tags": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+target_database": z.string().optional(),
      "+target_schema": z.string().optional(),
      "+transient": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+unique_key": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+updated_at": z.string().optional(),
      alias: z.string().optional(),
      check_cols: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
          ])
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
                      ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                    []
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
        .describe("grant config. each key is a database permission and the value is the grantee of that permission")
        .optional(),
      invalidate_hard_deletes: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      meta: z.record(z.any()).optional(),
      persist_docs: z
        .object({
          columns: z
            .any()
            .superRefine((x, ctx) => {
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
              const errors = schemas.reduce(
                (errors: z.ZodError[], schema) =>
                  ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
                []
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
        .describe("Configurations for the persistence of the dbt documentation.")
        .optional(),
      "post-hook": z.array(z.string()).optional(),
      "pre-hook": z.array(z.string()).optional(),
      quote_columns: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      transient: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      unique_key: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
    .catchall(
      z.any().superRefine((x, ctx) => {
        const schemas = [z.any(), z.null()];
        const errors = schemas.reduce(
          (errors: z.ZodError[], schema) =>
            ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
          []
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
    )
    .optional(),
  sources: z
    .object({
      "+enabled": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+meta": z.record(z.any()).optional(),
      "+tags": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      meta: z.record(z.any()).optional(),
      tags: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
    .catchall(
      z.any().superRefine((x, ctx) => {
        const schemas = [z.any(), z.null()];
        const errors = schemas.reduce(
          (errors: z.ZodError[], schema) =>
            ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
          []
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
    )
    .optional(),
  "target-path": z.string().optional(),
  "test-paths": z.array(z.string()).optional(),
  tests: z
    .object({
      "+alias": z.string().optional(),
      "+database": z.string().optional(),
      "+enabled": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+error_if": z.string().optional(),
      "+fail_calc": z.string().optional(),
      "+limit": z.number().optional(),
      "+meta": z.record(z.any()).optional(),
      "+schema": z.union([z.string(), z.null()]).optional(),
      "+severity": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.enum(["warn", "error"])];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+store_failures": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+tags": z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string(), z.array(z.string())];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      "+warn_if": z.string().optional(),
      enabled: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      meta: z.record(z.any()).optional(),
      severity: z
        .any()
        .superRefine((x, ctx) => {
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.enum(["warn", "error"])];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
          const errors = schemas.reduce(
            (errors: z.ZodError[], schema) =>
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
              ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
            []
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
      alias: z.string().optional(),
      database: z.string().optional(),
      schema: z.union([z.string(), z.null()]).optional(),
    })
    .catchall(
      z.any().superRefine((x, ctx) => {
        const schemas = [z.any(), z.null()];
        const errors = schemas.reduce(
          (errors: z.ZodError[], schema) =>
            ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)),
          []
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
    )
    .describe(
      "Configurations set in the dbt_project.yml file will apply to all tests that don't have a more specific configuration set."
    )
    .optional(),
  vars: z.record(z.any()).optional(),
});

export type DbtProject = z.infer<typeof dbtProjectSchema>;
