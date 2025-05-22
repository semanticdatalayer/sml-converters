"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbtProjectSchema = void 0;
const zod_1 = require("zod");
// generated based on https://raw.githubusercontent.com/dbt-labs/dbt-jsonschema/main/schemas/dbt_project.json
exports.dbtProjectSchema = zod_1.z.object({
    version: zod_1.z.string().optional(),
    name: zod_1.z.string(),
    "analysis-paths": zod_1.z.array(zod_1.z.string()).optional(),
    "asset-paths": zod_1.z.array(zod_1.z.string()).optional(),
    "clean-targets": zod_1.z.array(zod_1.z.string()).optional(),
    "config-version": zod_1.z.number().default(2),
    dispatch: zod_1.z
        .array(zod_1.z.object({
        macro_namespace: zod_1.z.string(),
        search_order: zod_1.z.array(zod_1.z.string()),
    }))
        .optional(),
    "docs-paths": zod_1.z.array(zod_1.z.string()).optional(),
    "log-path": zod_1.z.string().optional(),
    "macro-paths": zod_1.z.array(zod_1.z.string()).optional(),
    metrics: zod_1.z
        .object({
        "+enabled": zod_1.z
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
        "+treat_null_values_as_zero": zod_1.z
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
        treat_null_values_as_zero: zod_1.z
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
        .catchall(zod_1.z.any().superRefine((x, ctx) => {
        const schemas = [zod_1.z.any(), zod_1.z.null()];
        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
        if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
            });
        }
    }))
        .describe("Configurations set in the dbt_project.yml file will apply to all metrics that don't have a more specific configuration set.")
        .optional(),
    "model-paths": zod_1.z.array(zod_1.z.string()).optional(),
    models: zod_1.z
        .object({
        "+alias": zod_1.z.string().optional(),
        "+bind": zod_1.z
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
        "+contract": zod_1.z
            .object({
            enforced: zod_1.z.any().superRefine((x, ctx) => {
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
            }),
        })
            .optional(),
        "+copy_grants": zod_1.z
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
        "+database": zod_1.z.string().optional(),
        "+docs": zod_1.z
            .object({
            node_color: zod_1.z
                .string()
                .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
                .describe("The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.")
                .optional(),
            show: zod_1.z.boolean().default(true),
        })
            .describe("Configurations for the appearance of nodes in the dbt documentation.")
            .optional(),
        "+enabled": zod_1.z
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
        "+file_format": zod_1.z.string().optional(),
        "+grant_access_to": zod_1.z
            .array(zod_1.z.object({
            dataset: zod_1.z.string().optional(),
            project: zod_1.z.string().optional(),
        }))
            .describe("Configuration, specific to BigQuery adapter, used to setup authorized views.")
            .optional(),
        "+grants": zod_1.z
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
        "+hours_to_expiration": zod_1.z
            .number()
            .describe("Configuration specific to BigQuery adapter used to set an expiration delay (in hours) to a table.")
            .optional(),
        "+incremental_strategy": zod_1.z.string().optional(),
        "+kms_key_name": zod_1.z
            .string()
            .describe("Configuration, specific to BigQuery adapter, of the KMS key name used for data encryption.")
            .optional(),
        "+labels": zod_1.z
            .record(zod_1.z.union([
            zod_1.z.any().superRefine((x, ctx) => {
                const schemas = [
                    zod_1.z.string().regex(new RegExp("^[a-z0-9_-]{0,64}$")),
                    zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
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
            }),
            zod_1.z.never(),
        ]))
            .superRefine((value, ctx) => {
            for (const key in value) {
                let evaluated = false;
                if (key.match(new RegExp("^[a-z][a-z0-9_-]{0,63}$"))) {
                    evaluated = true;
                    const result = zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [
                            zod_1.z.string().regex(new RegExp("^[a-z0-9_-]{0,64}$")),
                            zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
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
            .describe("Configurations specific to BigQuery adapter used to add labels and tags to tables & views created by dbt.")
            .optional(),
        "+location": zod_1.z.string().optional(),
        "+materialized": zod_1.z.string().optional(),
        "+meta": zod_1.z.record(zod_1.z.any()).optional(),
        "+on_schema_change": zod_1.z.enum(["append_new_columns", "fail", "ignore", "sync_all_columns"]).optional(),
        "+persist_docs": zod_1.z
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
            .describe("Configurations for the persistence of the dbt documentation.")
            .optional(),
        "+post-hook": zod_1.z.array(zod_1.z.string()).optional(),
        "+pre-hook": zod_1.z.array(zod_1.z.string()).optional(),
        "+schema": zod_1.z.union([zod_1.z.string(), zod_1.z.null()]).optional(),
        "+sql_header": zod_1.z.string().optional(),
        "+tags": zod_1.z
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
        "+transient": zod_1.z
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
        alias: zod_1.z.string().optional(),
        bind: zod_1.z
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
            enforced: zod_1.z.any().superRefine((x, ctx) => {
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
            }),
        })
            .optional(),
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
        docs: zod_1.z
            .object({
            node_color: zod_1.z
                .string()
                .regex(new RegExp("^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6}|[^#][a-zA-Z]*)$"))
                .describe("The color of the node on the DAG in the documentation. It must be an Hex code or a valid CSS color name.")
                .optional(),
            show: zod_1.z.boolean().default(true),
        })
            .describe("Configurations for the appearance of nodes in the dbt documentation.")
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
        file_format: zod_1.z.string().optional(),
        grant_access_to: zod_1.z
            .array(zod_1.z.object({
            dataset: zod_1.z.string().optional(),
            project: zod_1.z.string().optional(),
        }))
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
        incremental_strategy: zod_1.z.string().optional(),
        kms_key_name: zod_1.z
            .string()
            .describe("Configuration, specific to BigQuery adapter, of the KMS key name used for data encryption.")
            .optional(),
        labels: zod_1.z
            .record(zod_1.z.union([
            zod_1.z.any().superRefine((x, ctx) => {
                const schemas = [
                    zod_1.z.string().regex(new RegExp("^[a-z0-9_-]{0,64}$")),
                    zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
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
            }),
            zod_1.z.never(),
        ]))
            .superRefine((value, ctx) => {
            for (const key in value) {
                let evaluated = false;
                if (key.match(new RegExp("^[a-z][a-z0-9_-]{0,63}$"))) {
                    evaluated = true;
                    const result = zod_1.z
                        .any()
                        .superRefine((x, ctx) => {
                        const schemas = [
                            zod_1.z.string().regex(new RegExp("^[a-z0-9_-]{0,64}$")),
                            zod_1.z.string().regex(new RegExp("\\{\\{.*\\}\\}")),
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
            .describe("Configurations specific to BigQuery adapter used to add labels and tags to tables & views created by dbt.")
            .optional(),
        location: zod_1.z.string().optional(),
        materialized: zod_1.z.string().optional(),
        meta: zod_1.z.record(zod_1.z.any()).optional(),
        on_schema_change: zod_1.z.enum(["append_new_columns", "fail", "ignore", "sync_all_columns"]).optional(),
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
            .describe("Configurations for the persistence of the dbt documentation.")
            .optional(),
        "post-hook": zod_1.z.array(zod_1.z.string()).optional(),
        "pre-hook": zod_1.z.array(zod_1.z.string()).optional(),
        schema: zod_1.z.union([zod_1.z.string(), zod_1.z.null()]).optional(),
        sql_header: zod_1.z.string().optional(),
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
        transient: zod_1.z
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
        .catchall(zod_1.z.any().superRefine((x, ctx) => {
        const schemas = [zod_1.z.any(), zod_1.z.null()];
        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
        if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
            });
        }
    }))
        .describe("Configurations set in the dbt_project.yml file will apply to all models that don't have a more specific configuration set.")
        .optional(),
    "on-run-end": zod_1.z.union([zod_1.z.array(zod_1.z.string()), zod_1.z.string()]).optional(),
    "on-run-start": zod_1.z.union([zod_1.z.array(zod_1.z.string()), zod_1.z.string()]).optional(),
    "packages-install-path": zod_1.z.string().optional(),
    profile: zod_1.z.string().optional(),
    "query-comment": zod_1.z
        .any()
        .superRefine((x, ctx) => {
        const schemas = [
            zod_1.z.string(),
            zod_1.z.object({
                append: zod_1.z
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
                comment: zod_1.z.string().optional(),
                "job-label": zod_1.z
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
        .optional(),
    "require-dbt-version": zod_1.z
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
    "seed-paths": zod_1.z.array(zod_1.z.string()).optional(),
    seeds: zod_1.z
        .object({
        "+copy_grants": zod_1.z
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
        "+database": zod_1.z.string().optional(),
        "+enabled": zod_1.z
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
        "+grants": zod_1.z
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
        "+meta": zod_1.z.record(zod_1.z.any()).optional(),
        "+persist_docs": zod_1.z
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
            .describe("Configurations for the persistence of the dbt documentation.")
            .optional(),
        "+quote_columns": zod_1.z
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
        "+schema": zod_1.z.union([zod_1.z.string(), zod_1.z.null()]).optional(),
        "+tags": zod_1.z
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
        "+transient": zod_1.z
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
        "+column_types": zod_1.z
            .record(zod_1.z.string())
            .superRefine((value, ctx) => {
            for (const key in value) {
                if (key.match(new RegExp(""))) {
                    const result = zod_1.z.string().safeParse(value[key]);
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
        "+full_refresh": zod_1.z
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
        meta: zod_1.z.record(zod_1.z.any()).optional(),
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
            .describe("Configurations for the persistence of the dbt documentation.")
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
        transient: zod_1.z
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
        column_types: zod_1.z
            .record(zod_1.z.string())
            .superRefine((value, ctx) => {
            for (const key in value) {
                if (key.match(new RegExp(""))) {
                    const result = zod_1.z.string().safeParse(value[key]);
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
        full_refresh: zod_1.z
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
        schema: zod_1.z.union([zod_1.z.string(), zod_1.z.null()]).optional(),
    })
        .catchall(zod_1.z.any().superRefine((x, ctx) => {
        const schemas = [zod_1.z.any(), zod_1.z.null()];
        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
        if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
            });
        }
    }))
        .optional(),
    "snapshot-paths": zod_1.z.array(zod_1.z.string()).optional(),
    snapshots: zod_1.z
        .object({
        "+alias": zod_1.z.string().optional(),
        "+check_cols": zod_1.z
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
        "+enabled": zod_1.z
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
        "+grants": zod_1.z
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
        "+invalidate_hard_deletes": zod_1.z
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
        "+meta": zod_1.z.record(zod_1.z.any()).optional(),
        "+persist_docs": zod_1.z
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
            .describe("Configurations for the persistence of the dbt documentation.")
            .optional(),
        "+post-hook": zod_1.z.array(zod_1.z.string()).optional(),
        "+pre-hook": zod_1.z.array(zod_1.z.string()).optional(),
        "+quote_columns": zod_1.z
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
        "+strategy": zod_1.z.string().optional(),
        "+tags": zod_1.z
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
        "+target_database": zod_1.z.string().optional(),
        "+target_schema": zod_1.z.string().optional(),
        "+transient": zod_1.z
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
        "+unique_key": zod_1.z
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
        "+updated_at": zod_1.z.string().optional(),
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
        invalidate_hard_deletes: zod_1.z
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
        meta: zod_1.z.record(zod_1.z.any()).optional(),
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
        transient: zod_1.z
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
        .catchall(zod_1.z.any().superRefine((x, ctx) => {
        const schemas = [zod_1.z.any(), zod_1.z.null()];
        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
        if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
            });
        }
    }))
        .optional(),
    sources: zod_1.z
        .object({
        "+enabled": zod_1.z
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
        "+meta": zod_1.z.record(zod_1.z.any()).optional(),
        "+tags": zod_1.z
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
        meta: zod_1.z.record(zod_1.z.any()).optional(),
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
        .catchall(zod_1.z.any().superRefine((x, ctx) => {
        const schemas = [zod_1.z.any(), zod_1.z.null()];
        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
        if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
            });
        }
    }))
        .optional(),
    "target-path": zod_1.z.string().optional(),
    "test-paths": zod_1.z.array(zod_1.z.string()).optional(),
    tests: zod_1.z
        .object({
        "+alias": zod_1.z.string().optional(),
        "+database": zod_1.z.string().optional(),
        "+enabled": zod_1.z
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
        "+error_if": zod_1.z.string().optional(),
        "+fail_calc": zod_1.z.string().optional(),
        "+limit": zod_1.z.number().optional(),
        "+meta": zod_1.z.record(zod_1.z.any()).optional(),
        "+schema": zod_1.z.union([zod_1.z.string(), zod_1.z.null()]).optional(),
        "+severity": zod_1.z
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
        "+store_failures": zod_1.z
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
        "+tags": zod_1.z
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
        "+warn_if": zod_1.z.string().optional(),
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
        meta: zod_1.z.record(zod_1.z.any()).optional(),
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
        alias: zod_1.z.string().optional(),
        database: zod_1.z.string().optional(),
        schema: zod_1.z.union([zod_1.z.string(), zod_1.z.null()]).optional(),
    })
        .catchall(zod_1.z.any().superRefine((x, ctx) => {
        const schemas = [zod_1.z.any(), zod_1.z.null()];
        const errors = schemas.reduce((errors, schema) => ((result) => ("error" in result ? [...errors, result.error] : errors))(schema.safeParse(x)), []);
        if (schemas.length - errors.length !== 1) {
            ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
            });
        }
    }))
        .describe("Configurations set in the dbt_project.yml file will apply to all tests that don't have a more specific configuration set.")
        .optional(),
    vars: zod_1.z.record(zod_1.z.any()).optional(),
});
