"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbtPropertySchema = exports.dbtSourceSchema = exports.dbtSnapshotSchema = exports.dbtSemanticModelsSchema = exports.dbtSeedsSchema = exports.dbtModelsSchema = exports.dbtMetricSchema = exports.dbtMacroSchema = exports.dbtGroupsSchema = exports.dbtExposureSchema = exports.dbtAnalysisSchema = void 0;
const zod_1 = require("zod");
exports.dbtAnalysisSchema = zod_1.z.object({
    name: zod_1.z.string(),
    columns: zod_1.z
        .array(zod_1.z
        .object({
        name: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        data_type: zod_1.z.string().optional(),
    })
        .strict())
        .optional(),
    config: zod_1.z
        .object({
        tags: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
    description: zod_1.z.string().optional(),
    docs: zod_1.z
        .object({
        node_color: zod_1.z
            .string()
            .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
            .describe("The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.")
            .optional(),
        show: zod_1.z.boolean().default(true),
    })
        .strict()
        .describe("Configurations for the appearance of nodes in the dbt documentation.")
        .optional(),
    group: zod_1.z.string().optional(),
});
exports.dbtExposureSchema = zod_1.z.object({
    name: zod_1.z.string(),
    label: zod_1.z.string().optional(),
    type: zod_1.z.enum(["dashboard", "notebook", "analysis", "ml", "application"]),
    depends_on: zod_1.z.array(zod_1.z.string()),
    description: zod_1.z.string().optional(),
    maturity: zod_1.z.enum(["high", "medium", "low"]).optional(),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
    owner: zod_1.z.object({ name: zod_1.z.string().optional(), email: zod_1.z.string() }).strict(),
    tags: zod_1.z
        .any()
        .superRefine((x, ctx) => {
        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
    url: zod_1.z.string().optional(),
});
exports.dbtGroupsSchema = zod_1.z
    .object({
    name: zod_1.z.string(),
    owner: zod_1.z
        .object({
        name: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
    })
        .catchall(zod_1.z.any()),
})
    .strict();
exports.dbtMacroSchema = zod_1.z
    .object({
    name: zod_1.z.string(),
    arguments: zod_1.z
        .array(zod_1.z
        .object({
        name: zod_1.z.string(),
        type: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
    })
        .strict())
        .optional(),
    description: zod_1.z.string().optional(),
    docs: zod_1.z
        .object({
        node_color: zod_1.z
            .string()
            .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
            .describe("The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.")
            .optional(),
        show: zod_1.z.boolean().default(true),
    })
        .strict()
        .describe("Configurations for the appearance of nodes in the dbt documentation.")
        .optional(),
})
    .strict();
exports.dbtMetricSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    filter: zod_1.z.string().optional(),
    group: zod_1.z.string().optional(),
    label: zod_1.z.string(),
    name: zod_1.z.string().regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")),
    type: zod_1.z.enum([
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
    type_params: zod_1.z.object({
        denominator: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [
                zod_1.z.string(),
                zod_1.z
                    .object({
                    alias: zod_1.z.string().optional(),
                    filter: zod_1.z.string().optional(),
                    name: zod_1.z.string().optional(),
                })
                    .strict(),
            ];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        expr: zod_1.z.union([zod_1.z.string(), zod_1.z.boolean()]).optional(),
        grain_to_date: zod_1.z.string().optional(),
        measure: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [
                zod_1.z.string(),
                zod_1.z.object({
                    alias: zod_1.z.string().optional(),
                    filter: zod_1.z.string().optional(),
                    name: zod_1.z.string().optional(),
                }),
            ];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        metrics: zod_1.z
            .array(zod_1.z.union([
            zod_1.z
                .object({
                alias: zod_1.z.string().optional(),
                filter: zod_1.z.string().optional(),
                name: zod_1.z.string().optional(),
                offset_to_grain: zod_1.z.string().optional(),
                offset_window: zod_1.z.string().optional(),
            })
                .strict(),
            zod_1.z.string(),
        ]))
            .optional(),
        numerator: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [
                zod_1.z.string(),
                zod_1.z
                    .object({
                    alias: zod_1.z.string().optional(),
                    filter: zod_1.z.string().optional(),
                    name: zod_1.z.string().optional(),
                })
                    .strict(),
            ];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        window: zod_1.z.string().optional(),
    }),
});
exports.dbtModelsSchema = zod_1.z
    .object({
    name: zod_1.z.string(),
    access: zod_1.z.enum(["private", "protected", "public"]).optional(),
    columns: zod_1.z
        .array(zod_1.z
        .object({
        name: zod_1.z.string(),
        constraints: zod_1.z
            .array(zod_1.z.object({
            columns: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            expression: zod_1.z.string().optional(),
            name: zod_1.z.string().optional(),
            type: zod_1.z.string(),
            warn_unenforced: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            warn_unsupported: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        }))
            .optional(),
        data_type: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        meta: zod_1.z.record(zod_1.z.any()).optional(),
        policy_tags: zod_1.z
            .array(zod_1.z.string())
            .describe("Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.")
            .optional(),
        quote: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        tests: zod_1.z
            .array(zod_1.z.union([
            zod_1.z.string(),
            zod_1.z.object({
                relationships: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    field: zod_1.z.string().describe("The foreign key column").default("<FOREIGN_KEY_COLUMN>"),
                    to: zod_1.z.string().default("ref('')"),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                accepted_values: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    quote: zod_1.z.boolean().optional(),
                    values: zod_1.z.array(zod_1.z.string()),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                not_null: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                unique: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
        ]))
            .optional(),
        tags: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        .strict())
        .optional(),
    config: zod_1.z
        .object({
        auto_refresh: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        backup: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        contract: zod_1.z
            .object({
            enforced: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        file_format: zod_1.z.string().optional(),
        grant_access_to: zod_1.z
            .array(zod_1.z.object({ database: zod_1.z.string(), project: zod_1.z.string() }).strict())
            .describe("Configuration, specific to BigQuery adapter, used to setup authorized views.")
            .optional(),
        grants: zod_1.z
            .record(zod_1.z.union([
            zod_1.z.any().superRefine((x, ctx) => {
                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
                if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                    });
                }
            }),
            zod_1.z.never(),
        ]))
            .superRefine((value, ctx) => {
            for (const key in value) {
                let evaluated = false;
                if (key.match(new RegExp(".*"))) {
                    evaluated = true;
                    const result = zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    const result = zod_1.z.never().safeParse(value[key]);
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
        hours_to_expiration: zod_1.z
            .number()
            .describe("Configuration specific to BigQuery adapter used to set an expiration delay (in hours) to a table.")
            .optional(),
        kms_key_name: zod_1.z
            .string()
            .regex(new RegExp("projects/[a-zA-Z0-9_-]*/locations/[a-zA-Z0-9_-]*/keyRings/.*/cryptoKeys/.*"))
            .describe("Configuration of the KMS key name, specific to BigQuery adapter.")
            .optional(),
        labels: zod_1.z
            .record(zod_1.z.union([zod_1.z.string().regex(new RegExp("^[a-z0-9_-]{0,63}$")), zod_1.z.never()]))
            .superRefine((value, ctx) => {
            for (const key in value) {
                let evaluated = false;
                if (key.match(new RegExp("^[a-z][a-z0-9_-]{0,62}$"))) {
                    evaluated = true;
                    const result = zod_1.z.string().regex(new RegExp("^[a-z0-9_-]{0,63}$")).safeParse(value[key]);
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
                    const result = zod_1.z.never().safeParse(value[key]);
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
            .describe("Configuration specific to BigQuery adapter used to add labels and tags to tables/views created by dbt.")
            .optional(),
        location: zod_1.z.string().optional(),
        materialized: zod_1.z.string().optional(),
        on_configuration_change: zod_1.z.enum(["apply", "continue", "fail"]).optional(),
        on_schema_change: zod_1.z.enum(["append_new_columns", "fail", "ignore", "sync_all_columns"]).optional(),
        sql_header: zod_1.z.string().optional(),
        snowflake_warehouse: zod_1.z.string().optional(),
        target_lag: zod_1.z.string().regex(new RegExp("^(?:downstream|\\d+\\s*(?:seconds|minutes|hours|days))$")).optional(),
    })
        .optional(),
    constraints: zod_1.z
        .array(zod_1.z.object({
        columns: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        expression: zod_1.z.string().optional(),
        name: zod_1.z.string().optional(),
        type: zod_1.z.string(),
        warn_unenforced: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        warn_unsupported: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
    }))
        .optional(),
    description: zod_1.z.string().optional(),
    docs: zod_1.z
        .object({
        node_color: zod_1.z
            .string()
            .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
            .describe("The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.")
            .optional(),
        show: zod_1.z.boolean().default(true),
    })
        .strict()
        .describe("Configurations for the appearance of nodes in the dbt documentation.")
        .optional(),
    group: zod_1.z.string().optional(),
    latest_version: zod_1.z.number().optional(),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
    tests: zod_1.z
        .array(zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            relationships: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                field: zod_1.z.string().describe("The foreign key column").default("<FOREIGN_KEY_COLUMN>"),
                to: zod_1.z.string().default("ref('')"),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            accepted_values: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                quote: zod_1.z.boolean().optional(),
                values: zod_1.z.array(zod_1.z.string()),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            not_null: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            unique: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
    ]))
        .optional(),
    versions: zod_1.z
        .array(zod_1.z.object({
        v: zod_1.z.number(),
        config: zod_1.z
            .object({
            auto_refresh: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            backup: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            contract: zod_1.z
                .object({
                enforced: zod_1.z
                    .any()
                    .superRefine((x, ctx) => {
                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            file_format: zod_1.z.string().optional(),
            grant_access_to: zod_1.z
                .array(zod_1.z
                .object({
                database: zod_1.z.string(),
                project: zod_1.z.string(),
            })
                .strict())
                .describe("Configuration, specific to BigQuery adapter, used to setup authorized views.")
                .optional(),
            grants: zod_1.z
                .record(zod_1.z.union([
                zod_1.z.any().superRefine((x, ctx) => {
                    const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
                    if (schemas.length - errors.length !== 1) {
                        ctx.addIssue({
                            path: ctx.path,
                            code: "invalid_union",
                            unionErrors: errors,
                            message: "Invalid input: Should pass single schema",
                        });
                    }
                }),
                zod_1.z.never(),
            ]))
                .superRefine((value, ctx) => {
                for (const key in value) {
                    let evaluated = false;
                    if (key.match(new RegExp(".*"))) {
                        evaluated = true;
                        const result = zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        const result = zod_1.z.never().safeParse(value[key]);
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
            hours_to_expiration: zod_1.z
                .number()
                .describe("Configuration specific to BigQuery adapter used to set an expiration delay (in hours) to a table.")
                .optional(),
            kms_key_name: zod_1.z
                .string()
                .regex(new RegExp("projects/[a-zA-Z0-9_-]*/locations/[a-zA-Z0-9_-]*/keyRings/.*/cryptoKeys/.*"))
                .describe("Configuration of the KMS key name, specific to BigQuery adapter.")
                .optional(),
            labels: zod_1.z
                .record(zod_1.z.union([zod_1.z.string().regex(new RegExp("^[a-z0-9_-]{0,63}$")), zod_1.z.never()]))
                .superRefine((value, ctx) => {
                for (const key in value) {
                    let evaluated = false;
                    if (key.match(new RegExp("^[a-z][a-z0-9_-]{0,62}$"))) {
                        evaluated = true;
                        const result = zod_1.z.string().regex(new RegExp("^[a-z0-9_-]{0,63}$")).safeParse(value[key]);
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
                        const result = zod_1.z.never().safeParse(value[key]);
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
                .describe("Configuration specific to BigQuery adapter used to add labels and tags to tables/views created by dbt.")
                .optional(),
            location: zod_1.z.string().optional(),
            materialized: zod_1.z.string().optional(),
            on_configuration_change: zod_1.z.enum(["apply", "continue", "fail"]).optional(),
            on_schema_change: zod_1.z.enum(["append_new_columns", "fail", "ignore", "sync_all_columns"]).optional(),
            sql_header: zod_1.z.string().optional(),
            snowflake_warehouse: zod_1.z.string().optional(),
            target_lag: zod_1.z
                .string()
                .regex(new RegExp("^(?:downstream|\\d+\\s*(?:seconds|minutes|hours|days))$"))
                .optional(),
        })
            .optional(),
        columns: zod_1.z
            .array(zod_1.z.union([
            zod_1.z.object({
                include: zod_1.z
                    .any()
                    .superRefine((x, ctx) => {
                    const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                exclude: zod_1.z
                    .any()
                    .superRefine((x, ctx) => {
                    const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            zod_1.z
                .object({
                name: zod_1.z.string(),
                constraints: zod_1.z
                    .array(zod_1.z.object({
                    columns: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    expression: zod_1.z.string().optional(),
                    name: zod_1.z.string().optional(),
                    type: zod_1.z.string(),
                    warn_unenforced: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_unsupported: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                }))
                    .optional(),
                data_type: zod_1.z.string().optional(),
                description: zod_1.z.string().optional(),
                meta: zod_1.z.record(zod_1.z.any()).optional(),
                policy_tags: zod_1.z
                    .array(zod_1.z.string())
                    .describe("Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.")
                    .optional(),
                quote: zod_1.z
                    .any()
                    .superRefine((x, ctx) => {
                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                tests: zod_1.z
                    .array(zod_1.z.union([
                    zod_1.z.string(),
                    zod_1.z.object({
                        relationships: zod_1.z
                            .object({
                            name: zod_1.z.string().optional(),
                            config: zod_1.z
                                .object({
                                alias: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                database: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                enabled: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                error_if: zod_1.z.string().optional(),
                                fail_calc: zod_1.z.string().optional(),
                                limit: zod_1.z.number().optional(),
                                schema: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                severity: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [
                                        zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                        zod_1.z.enum(["warn", "error"]),
                                    ];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                store_failures: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                tags: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                warn_if: zod_1.z.string().optional(),
                            })
                                .describe("Configurations set here will override configs set in dbt_project.yml.")
                                .optional(),
                            field: zod_1.z.string().describe("The foreign key column").default("<FOREIGN_KEY_COLUMN>"),
                            to: zod_1.z.string().default("ref('')"),
                            where: zod_1.z.string().optional(),
                        })
                            .optional(),
                    }),
                    zod_1.z.object({
                        accepted_values: zod_1.z
                            .object({
                            name: zod_1.z.string().optional(),
                            config: zod_1.z
                                .object({
                                alias: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                database: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                enabled: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                error_if: zod_1.z.string().optional(),
                                fail_calc: zod_1.z.string().optional(),
                                limit: zod_1.z.number().optional(),
                                schema: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                severity: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [
                                        zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                        zod_1.z.enum(["warn", "error"]),
                                    ];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                store_failures: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                tags: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                warn_if: zod_1.z.string().optional(),
                            })
                                .describe("Configurations set here will override configs set in dbt_project.yml.")
                                .optional(),
                            quote: zod_1.z.boolean().optional(),
                            values: zod_1.z.array(zod_1.z.string()),
                            where: zod_1.z.string().optional(),
                        })
                            .optional(),
                    }),
                    zod_1.z.object({
                        not_null: zod_1.z
                            .object({
                            name: zod_1.z.string().optional(),
                            config: zod_1.z
                                .object({
                                alias: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                database: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                enabled: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                error_if: zod_1.z.string().optional(),
                                fail_calc: zod_1.z.string().optional(),
                                limit: zod_1.z.number().optional(),
                                schema: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                severity: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [
                                        zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                        zod_1.z.enum(["warn", "error"]),
                                    ];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                store_failures: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                tags: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                warn_if: zod_1.z.string().optional(),
                            })
                                .describe("Configurations set here will override configs set in dbt_project.yml.")
                                .optional(),
                            where: zod_1.z.string().optional(),
                        })
                            .optional(),
                    }),
                    zod_1.z.object({
                        unique: zod_1.z
                            .object({
                            name: zod_1.z.string().optional(),
                            config: zod_1.z
                                .object({
                                alias: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                database: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                enabled: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                error_if: zod_1.z.string().optional(),
                                fail_calc: zod_1.z.string().optional(),
                                limit: zod_1.z.number().optional(),
                                schema: zod_1.z
                                    .string()
                                    .describe("Only relevant when `store_failures` is true")
                                    .optional(),
                                severity: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [
                                        zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                        zod_1.z.enum(["warn", "error"]),
                                    ];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                store_failures: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                tags: zod_1.z
                                    .any()
                                    .superRefine((x, ctx) => {
                                    const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                                warn_if: zod_1.z.string().optional(),
                            })
                                .describe("Configurations set here will override configs set in dbt_project.yml.")
                                .optional(),
                            where: zod_1.z.string().optional(),
                        })
                            .optional(),
                    }),
                ]))
                    .optional(),
                tags: zod_1.z
                    .any()
                    .superRefine((x, ctx) => {
                    const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        ]))
            .optional(),
    }))
        .optional(),
})
    .strict();
exports.dbtSeedsSchema = zod_1.z
    .object({
    name: zod_1.z.string(),
    columns: zod_1.z
        .array(zod_1.z
        .object({
        name: zod_1.z.string(),
        constraints: zod_1.z
            .array(zod_1.z.object({
            columns: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            expression: zod_1.z.string().optional(),
            name: zod_1.z.string().optional(),
            type: zod_1.z.string(),
            warn_unenforced: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            warn_unsupported: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        }))
            .optional(),
        data_type: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        meta: zod_1.z.record(zod_1.z.any()).optional(),
        policy_tags: zod_1.z
            .array(zod_1.z.string())
            .describe("Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.")
            .optional(),
        quote: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        tests: zod_1.z
            .array(zod_1.z.union([
            zod_1.z.string(),
            zod_1.z.object({
                relationships: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    field: zod_1.z.string().describe("The foreign key column").default("<FOREIGN_KEY_COLUMN>"),
                    to: zod_1.z.string().default("ref('')"),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                accepted_values: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    quote: zod_1.z.boolean().optional(),
                    values: zod_1.z.array(zod_1.z.string()),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                not_null: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                unique: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
        ]))
            .optional(),
        tags: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        .strict())
        .optional(),
    config: zod_1.z
        .object({
        column_types: zod_1.z.record(zod_1.z.any()).optional(),
        copy_grants: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        database: zod_1.z.string().optional(),
        enabled: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        grants: zod_1.z
            .record(zod_1.z.union([
            zod_1.z.any().superRefine((x, ctx) => {
                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
                if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                    });
                }
            }),
            zod_1.z.never(),
        ]))
            .superRefine((value, ctx) => {
            for (const key in value) {
                let evaluated = false;
                if (key.match(new RegExp(".*"))) {
                    evaluated = true;
                    const result = zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    const result = zod_1.z.never().safeParse(value[key]);
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
        quote_columns: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        schema: zod_1.z.string().optional(),
    })
        .optional(),
    description: zod_1.z.string().optional(),
    docs: zod_1.z
        .object({
        node_color: zod_1.z
            .string()
            .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
            .describe("The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.")
            .optional(),
        show: zod_1.z.boolean().default(true),
    })
        .strict()
        .describe("Configurations for the appearance of nodes in the dbt documentation.")
        .optional(),
    group: zod_1.z.string().optional(),
    tests: zod_1.z
        .array(zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            relationships: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                field: zod_1.z.string().describe("The foreign key column").default("<FOREIGN_KEY_COLUMN>"),
                to: zod_1.z.string().default("ref('')"),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            accepted_values: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                quote: zod_1.z.boolean().optional(),
                values: zod_1.z.array(zod_1.z.string()),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            not_null: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            unique: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
    ]))
        .optional(),
})
    .strict();
exports.dbtSemanticModelsSchema = zod_1.z
    .object({
    defaults: zod_1.z.object({ agg_time_dimension: zod_1.z.string().optional() }).strict().optional(),
    description: zod_1.z.string().optional(),
    dimensions: zod_1.z
        .array(zod_1.z
        .object({
        description: zod_1.z.string().optional(),
        expr: zod_1.z.union([zod_1.z.string(), zod_1.z.boolean()]).optional(),
        is_partition: zod_1.z.boolean().optional(),
        name: zod_1.z.string().regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")),
        type: zod_1.z.enum(["CATEGORICAL", "TIME", "categorical", "time"]),
        type_params: zod_1.z
            .object({
            time_granularity: zod_1.z.enum([
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
            validity_params: zod_1.z
                .object({
                is_end: zod_1.z.boolean().optional(),
                is_start: zod_1.z.boolean().optional(),
            })
                .strict()
                .optional(),
        })
            .strict()
            .optional(),
    })
        .strict()
        .and(zod_1.z.union([
        zod_1.z
            .any()
            .refine((value) => !zod_1.z.any().safeParse(value).success, "Invalid input: Should NOT be valid against schema"),
        zod_1.z.any(),
    ])))
        .optional(),
    entities: zod_1.z
        .array(zod_1.z
        .object({
        entity: zod_1.z.string().optional(),
        expr: zod_1.z.union([zod_1.z.string(), zod_1.z.boolean()]).optional(),
        name: zod_1.z.string().regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")),
        role: zod_1.z.string().optional(),
        type: zod_1.z.enum(["PRIMARY", "UNIQUE", "FOREIGN", "NATURAL", "primary", "unique", "foreign", "natural"]),
    })
        .strict())
        .optional(),
    measures: zod_1.z
        .array(zod_1.z
        .object({
        agg: zod_1.z.enum([
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
        agg_params: zod_1.z
            .object({
            percentile: zod_1.z.number().optional(),
            use_approximate_percentile: zod_1.z.boolean().optional(),
            use_discrete_percentile: zod_1.z.boolean().optional(),
        })
            .strict()
            .optional(),
        agg_time_dimension: zod_1.z.string().regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")).optional(),
        create_metric: zod_1.z.boolean().optional(),
        create_metric_display_name: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        expr: zod_1.z.union([zod_1.z.string(), zod_1.z.number().int(), zod_1.z.boolean()]).optional(),
        name: zod_1.z.string().regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")),
        non_additive_dimension: zod_1.z
            .object({
            name: zod_1.z.string(),
            window_choice: zod_1.z.enum(["MIN", "MAX", "min", "max"]).optional(),
            window_groupings: zod_1.z.array(zod_1.z.string()).optional(),
        })
            .strict()
            .optional(),
    })
        .strict())
        .optional(),
    model: zod_1.z.string().default("ref('')"),
    name: zod_1.z.string().regex(new RegExp("(?!.*__).*^[a-z][a-z0-9_]*[a-z0-9]$")),
    primary_entity: zod_1.z.string().optional(),
})
    .strict();
exports.dbtSnapshotSchema = zod_1.z.object({
    name: zod_1.z.string(),
    columns: zod_1.z
        .array(zod_1.z
        .object({
        name: zod_1.z.string(),
        constraints: zod_1.z
            .array(zod_1.z.object({
            columns: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            expression: zod_1.z.string().optional(),
            name: zod_1.z.string().optional(),
            type: zod_1.z.string(),
            warn_unenforced: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            warn_unsupported: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        }))
            .optional(),
        data_type: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        meta: zod_1.z.record(zod_1.z.any()).optional(),
        policy_tags: zod_1.z
            .array(zod_1.z.string())
            .describe("Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.")
            .optional(),
        quote: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        tests: zod_1.z
            .array(zod_1.z.union([
            zod_1.z.string(),
            zod_1.z.object({
                relationships: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    field: zod_1.z.string().describe("The foreign key column").default("<FOREIGN_KEY_COLUMN>"),
                    to: zod_1.z.string().default("ref('')"),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                accepted_values: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    quote: zod_1.z.boolean().optional(),
                    values: zod_1.z.array(zod_1.z.string()),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                not_null: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                unique: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
        ]))
            .optional(),
        tags: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        .strict())
        .optional(),
    config: zod_1.z
        .object({
        alias: zod_1.z.string().optional(),
        check_cols: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        enabled: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        grants: zod_1.z
            .record(zod_1.z.union([
            zod_1.z.any().superRefine((x, ctx) => {
                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
                if (schemas.length - errors.length !== 1) {
                    ctx.addIssue({
                        path: ctx.path,
                        code: "invalid_union",
                        unionErrors: errors,
                        message: "Invalid input: Should pass single schema",
                    });
                }
            }),
            zod_1.z.never(),
        ]))
            .superRefine((value, ctx) => {
            for (const key in value) {
                let evaluated = false;
                if (key.match(new RegExp(".*"))) {
                    evaluated = true;
                    const result = zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    const result = zod_1.z.never().safeParse(value[key]);
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
        persist_docs: zod_1.z
            .object({
            columns: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            relation: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            .describe("Configurations for the persistence of the dbt documentation.")
            .optional(),
        "post-hook": zod_1.z.array(zod_1.z.string()).optional(),
        "pre-hook": zod_1.z.array(zod_1.z.string()).optional(),
        quote_columns: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        strategy: zod_1.z.string().optional(),
        tags: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        target_database: zod_1.z.string().optional(),
        target_schema: zod_1.z.string().optional(),
        unique_key: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        updated_at: zod_1.z.string().optional(),
    })
        .optional(),
    description: zod_1.z.string().optional(),
    docs: zod_1.z
        .object({
        node_color: zod_1.z
            .string()
            .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
            .describe("The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.")
            .optional(),
        show: zod_1.z.boolean().default(true),
    })
        .strict()
        .describe("Configurations for the appearance of nodes in the dbt documentation.")
        .optional(),
    group: zod_1.z.string().optional(),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
    tests: zod_1.z
        .array(zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            relationships: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                field: zod_1.z.string().describe("The foreign key column").default("<FOREIGN_KEY_COLUMN>"),
                to: zod_1.z.string().default("ref('')"),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            accepted_values: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                quote: zod_1.z.boolean().optional(),
                values: zod_1.z.array(zod_1.z.string()),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            not_null: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            unique: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
    ]))
        .optional(),
});
exports.dbtSourceSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .describe("How you will identify the schema in {{ source() }} calls. Unless `schema` is also set, this will be the name of the schema in the database."),
    config: zod_1.z.record(zod_1.z.any()).optional(),
    database: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    freshness: zod_1.z
        .any()
        .superRefine((x, ctx) => {
        const schemas = [
            zod_1.z
                .object({
                error_after: zod_1.z
                    .object({
                    count: zod_1.z.any().superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.number()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
                        if (schemas.length - errors.length !== 1) {
                            ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message: "Invalid input: Should pass single schema",
                            });
                        }
                    }),
                    period: zod_1.z.enum(["minute", "hour", "day"]),
                })
                    .strict()
                    .optional(),
                filter: zod_1.z.string().optional(),
                warn_after: zod_1.z
                    .object({
                    count: zod_1.z.any().superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.number()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
                        if (schemas.length - errors.length !== 1) {
                            ctx.addIssue({
                                path: ctx.path,
                                code: "invalid_union",
                                unionErrors: errors,
                                message: "Invalid input: Should pass single schema",
                            });
                        }
                    }),
                    period: zod_1.z.enum(["minute", "hour", "day"]),
                })
                    .strict()
                    .optional(),
            })
                .strict(),
            zod_1.z.literal(null),
        ];
        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
    loaded_at_field: zod_1.z.string().optional(),
    loader: zod_1.z.string().optional(),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
    overrides: zod_1.z
        .string()
        .describe("The name of another package installed in your project. If that package has a source with the same name as this one, its properties will be applied on top of the base properties of the overridden source. https://docs.getdbt.com/reference/resource-properties/overrides")
        .optional(),
    quoting: zod_1.z
        .object({
        database: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        identifier: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        schema: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
    schema: zod_1.z
        .string()
        .describe("The schema name as stored in the database. Only needed if you want to use a different `name` than what exists in the database (otherwise `name` is used by default)")
        .optional(),
    tables: zod_1.z
        .array(zod_1.z
        .object({
        name: zod_1.z
            .string()
            .describe("How you will identify the table in {{ source() }} calls. Unless `identifier` is also set, this will be the name of the table in the database."),
        columns: zod_1.z
            .array(zod_1.z
            .object({
            name: zod_1.z.string(),
            constraints: zod_1.z
                .array(zod_1.z.object({
                columns: zod_1.z
                    .any()
                    .superRefine((x, ctx) => {
                    const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                expression: zod_1.z.string().optional(),
                name: zod_1.z.string().optional(),
                type: zod_1.z.string(),
                warn_unenforced: zod_1.z
                    .any()
                    .superRefine((x, ctx) => {
                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                warn_unsupported: zod_1.z
                    .any()
                    .superRefine((x, ctx) => {
                    const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                    const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            }))
                .optional(),
            data_type: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            meta: zod_1.z.record(zod_1.z.any()).optional(),
            policy_tags: zod_1.z
                .array(zod_1.z.string())
                .describe("Configurations, specific to BigQuery adapter, used to set policy tags on specific columns, enabling column-level security. Only relevant when `persist_docs.columns` is true.")
                .optional(),
            quote: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            tests: zod_1.z
                .array(zod_1.z.union([
                zod_1.z.string(),
                zod_1.z.object({
                    relationships: zod_1.z
                        .object({
                        name: zod_1.z.string().optional(),
                        config: zod_1.z
                            .object({
                            alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                            database: zod_1.z
                                .string()
                                .describe("Only relevant when `store_failures` is true")
                                .optional(),
                            enabled: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            error_if: zod_1.z.string().optional(),
                            fail_calc: zod_1.z.string().optional(),
                            limit: zod_1.z.number().optional(),
                            schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                            severity: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [
                                    zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                    zod_1.z.enum(["warn", "error"]),
                                ];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            store_failures: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            tags: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            warn_if: zod_1.z.string().optional(),
                        })
                            .describe("Configurations set here will override configs set in dbt_project.yml.")
                            .optional(),
                        field: zod_1.z.string().describe("The foreign key column").default("<FOREIGN_KEY_COLUMN>"),
                        to: zod_1.z.string().default("ref('')"),
                        where: zod_1.z.string().optional(),
                    })
                        .optional(),
                }),
                zod_1.z.object({
                    accepted_values: zod_1.z
                        .object({
                        name: zod_1.z.string().optional(),
                        config: zod_1.z
                            .object({
                            alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                            database: zod_1.z
                                .string()
                                .describe("Only relevant when `store_failures` is true")
                                .optional(),
                            enabled: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            error_if: zod_1.z.string().optional(),
                            fail_calc: zod_1.z.string().optional(),
                            limit: zod_1.z.number().optional(),
                            schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                            severity: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [
                                    zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                    zod_1.z.enum(["warn", "error"]),
                                ];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            store_failures: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            tags: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            warn_if: zod_1.z.string().optional(),
                        })
                            .describe("Configurations set here will override configs set in dbt_project.yml.")
                            .optional(),
                        quote: zod_1.z.boolean().optional(),
                        values: zod_1.z.array(zod_1.z.string()),
                        where: zod_1.z.string().optional(),
                    })
                        .optional(),
                }),
                zod_1.z.object({
                    not_null: zod_1.z
                        .object({
                        name: zod_1.z.string().optional(),
                        config: zod_1.z
                            .object({
                            alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                            database: zod_1.z
                                .string()
                                .describe("Only relevant when `store_failures` is true")
                                .optional(),
                            enabled: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            error_if: zod_1.z.string().optional(),
                            fail_calc: zod_1.z.string().optional(),
                            limit: zod_1.z.number().optional(),
                            schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                            severity: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [
                                    zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                    zod_1.z.enum(["warn", "error"]),
                                ];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            store_failures: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            tags: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            warn_if: zod_1.z.string().optional(),
                        })
                            .describe("Configurations set here will override configs set in dbt_project.yml.")
                            .optional(),
                        where: zod_1.z.string().optional(),
                    })
                        .optional(),
                }),
                zod_1.z.object({
                    unique: zod_1.z
                        .object({
                        name: zod_1.z.string().optional(),
                        config: zod_1.z
                            .object({
                            alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                            database: zod_1.z
                                .string()
                                .describe("Only relevant when `store_failures` is true")
                                .optional(),
                            enabled: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            error_if: zod_1.z.string().optional(),
                            fail_calc: zod_1.z.string().optional(),
                            limit: zod_1.z.number().optional(),
                            schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                            severity: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [
                                    zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                    zod_1.z.enum(["warn", "error"]),
                                ];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            store_failures: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            tags: zod_1.z
                                .any()
                                .superRefine((x, ctx) => {
                                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                            warn_if: zod_1.z.string().optional(),
                        })
                            .describe("Configurations set here will override configs set in dbt_project.yml.")
                            .optional(),
                        where: zod_1.z.string().optional(),
                    })
                        .optional(),
                }),
            ]))
                .optional(),
            tags: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            .strict())
            .optional(),
        description: zod_1.z.string().optional(),
        external: zod_1.z.record(zod_1.z.any()).optional(),
        freshness: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [
                zod_1.z
                    .object({
                    error_after: zod_1.z
                        .object({
                        count: zod_1.z.any().superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.number()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
                            if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message: "Invalid input: Should pass single schema",
                                });
                            }
                        }),
                        period: zod_1.z.enum(["minute", "hour", "day"]),
                    })
                        .strict()
                        .optional(),
                    filter: zod_1.z.string().optional(),
                    warn_after: zod_1.z
                        .object({
                        count: zod_1.z.any().superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.number()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
                            if (schemas.length - errors.length !== 1) {
                                ctx.addIssue({
                                    path: ctx.path,
                                    code: "invalid_union",
                                    unionErrors: errors,
                                    message: "Invalid input: Should pass single schema",
                                });
                            }
                        }),
                        period: zod_1.z.enum(["minute", "hour", "day"]),
                    })
                        .strict()
                        .optional(),
                })
                    .strict(),
                zod_1.z.literal(null),
            ];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        identifier: zod_1.z
            .string()
            .describe("The table name as stored in the database. Only needed if you want to give the source a different name than what exists in the database (otherwise `name` is used by default)")
            .optional(),
        loaded_at_field: zod_1.z
            .string()
            .describe("Which column to check during data freshness tests. Only needed if the table has a different loaded_at_field to the one defined on the source overall.")
            .optional(),
        loader: zod_1.z.string().optional(),
        meta: zod_1.z.record(zod_1.z.any()).optional(),
        quoting: zod_1.z
            .object({
            database: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            identifier: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
            schema: zod_1.z
                .any()
                .superRefine((x, ctx) => {
                const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        tags: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
        tests: zod_1.z
            .array(zod_1.z.union([
            zod_1.z.string(),
            zod_1.z.object({
                relationships: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    field: zod_1.z.string().describe("The foreign key column").default("<FOREIGN_KEY_COLUMN>"),
                    to: zod_1.z.string().default("ref('')"),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                accepted_values: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    quote: zod_1.z.boolean().optional(),
                    values: zod_1.z.array(zod_1.z.string()),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                not_null: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
            zod_1.z.object({
                unique: zod_1.z
                    .object({
                    name: zod_1.z.string().optional(),
                    config: zod_1.z
                        .object({
                        alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        enabled: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        error_if: zod_1.z.string().optional(),
                        fail_calc: zod_1.z.string().optional(),
                        limit: zod_1.z.number().optional(),
                        schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                        severity: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [
                                zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
                                zod_1.z.enum(["warn", "error"]),
                            ];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        store_failures: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        tags: zod_1.z
                            .any()
                            .superRefine((x, ctx) => {
                            const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                            const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                        warn_if: zod_1.z.string().optional(),
                    })
                        .describe("Configurations set here will override configs set in dbt_project.yml.")
                        .optional(),
                    where: zod_1.z.string().optional(),
                })
                    .optional(),
            }),
        ]))
            .optional(),
    })
        .strict())
        .optional(),
    tags: zod_1.z
        .any()
        .superRefine((x, ctx) => {
        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
    tests: zod_1.z
        .array(zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            relationships: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                field: zod_1.z.string().describe("The foreign key column").default("<FOREIGN_KEY_COLUMN>"),
                to: zod_1.z.string().default("ref('')"),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            accepted_values: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                quote: zod_1.z.boolean().optional(),
                values: zod_1.z.array(zod_1.z.string()),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            not_null: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
        zod_1.z.object({
            unique: zod_1.z
                .object({
                name: zod_1.z.string().optional(),
                config: zod_1.z
                    .object({
                    alias: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    database: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    enabled: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    error_if: zod_1.z.string().optional(),
                    fail_calc: zod_1.z.string().optional(),
                    limit: zod_1.z.number().optional(),
                    schema: zod_1.z.string().describe("Only relevant when `store_failures` is true").optional(),
                    severity: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.enum(["warn", "error"])];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    store_failures: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")), zod_1.z.boolean()];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    tags: zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [zod_1.z.string(), zod_1.z.array(zod_1.z.string())];
                        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
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
                    warn_if: zod_1.z.string().optional(),
                })
                    .describe("Configurations set here will override configs set in dbt_project.yml.")
                    .optional(),
                where: zod_1.z.string().optional(),
            })
                .optional(),
        }),
    ]))
        .optional(),
});
exports.dbtPropertySchema = zod_1.z.object({
    version: zod_1.z.literal(2).optional(),
    analyses: zod_1.z.array(exports.dbtAnalysisSchema).optional(),
    exposures: zod_1.z.array(exports.dbtExposureSchema).optional(),
    groups: zod_1.z.array(exports.dbtGroupsSchema).optional(),
    macros: zod_1.z.array(exports.dbtMacroSchema).optional(),
    metrics: zod_1.z.array(exports.dbtMetricSchema).optional(),
    models: zod_1.z.array(exports.dbtModelsSchema).optional(),
    seeds: zod_1.z.array(exports.dbtSeedsSchema).optional(),
    semantic_models: zod_1.z.array(exports.dbtSemanticModelsSchema).optional(),
    snapshots: zod_1.z.array(exports.dbtSnapshotSchema).optional(),
    sources: zod_1.z.array(exports.dbtSourceSchema).optional(),
    meta: zod_1.z.any(),
});
