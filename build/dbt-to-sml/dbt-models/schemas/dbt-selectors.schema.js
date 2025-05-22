"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbtSelectorsSchema = void 0;
const zod_1 = require("zod");
exports.dbtSelectorsSchema = zod_1.z.object({
    selectors: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        default: zod_1.z
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
        definition: zod_1.z
            .any()
            .superRefine((x, ctx) => {
            const schemas = [
                zod_1.z
                    .object({
                    method: zod_1.z
                        .enum([
                        "tag",
                        "source",
                        "path",
                        "file",
                        "fqn",
                        "package",
                        "config",
                        "test_type",
                        "test_name",
                        "state",
                        "exposure",
                        "metric",
                        "result",
                        "source_status",
                        "group",
                        "wildcard",
                    ])
                        .optional(),
                    value: zod_1.z.string().optional(),
                    children: zod_1.z
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
                    parents: zod_1.z
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
                    children_depth: zod_1.z.number().optional(),
                    parents_depth: zod_1.z.number().optional(),
                    childrens_parents: zod_1.z
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
                    indirect_selection: zod_1.z.enum(["buildable", "cautious", "eager"]).optional(),
                })
                    .catchall(zod_1.z.any()),
                zod_1.z.string(),
                zod_1.z.array(zod_1.z.union([
                    zod_1.z.array(zod_1.z
                        .object({
                        method: zod_1.z
                            .enum([
                            "tag",
                            "source",
                            "path",
                            "file",
                            "fqn",
                            "package",
                            "config",
                            "test_type",
                            "test_name",
                            "state",
                            "exposure",
                            "metric",
                            "result",
                            "source_status",
                            "group",
                            "wildcard",
                        ])
                            .optional(),
                        value: zod_1.z.string().optional(),
                        children: zod_1.z
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
                        parents: zod_1.z
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
                        children_depth: zod_1.z.number().optional(),
                        parents_depth: zod_1.z.number().optional(),
                        childrens_parents: zod_1.z
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
                        indirect_selection: zod_1.z.enum(["buildable", "cautious", "eager"]).optional(),
                    })
                        .catchall(zod_1.z.any())),
                    zod_1.z
                        .object({
                        method: zod_1.z
                            .enum([
                            "tag",
                            "source",
                            "path",
                            "file",
                            "fqn",
                            "package",
                            "config",
                            "test_type",
                            "test_name",
                            "state",
                            "exposure",
                            "metric",
                            "result",
                            "source_status",
                            "group",
                            "wildcard",
                        ])
                            .optional(),
                        value: zod_1.z.string().optional(),
                        children: zod_1.z
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
                        parents: zod_1.z
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
                        children_depth: zod_1.z.number().optional(),
                        parents_depth: zod_1.z.number().optional(),
                        childrens_parents: zod_1.z
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
                        indirect_selection: zod_1.z.enum(["buildable", "cautious", "eager"]).optional(),
                    })
                        .catchall(zod_1.z.any()),
                    zod_1.z.array(zod_1.z.union([
                        zod_1.z.array(zod_1.z
                            .object({
                            method: zod_1.z
                                .enum([
                                "tag",
                                "source",
                                "path",
                                "file",
                                "fqn",
                                "package",
                                "config",
                                "test_type",
                                "test_name",
                                "state",
                                "exposure",
                                "metric",
                                "result",
                                "source_status",
                                "group",
                                "wildcard",
                            ])
                                .optional(),
                            value: zod_1.z.string().optional(),
                            children: zod_1.z
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
                            parents: zod_1.z
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
                            children_depth: zod_1.z.number().optional(),
                            parents_depth: zod_1.z.number().optional(),
                            childrens_parents: zod_1.z
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
                            indirect_selection: zod_1.z.enum(["buildable", "cautious", "eager"]).optional(),
                        })
                            .catchall(zod_1.z.any())),
                        zod_1.z
                            .object({
                            method: zod_1.z
                                .enum([
                                "tag",
                                "source",
                                "path",
                                "file",
                                "fqn",
                                "package",
                                "config",
                                "test_type",
                                "test_name",
                                "state",
                                "exposure",
                                "metric",
                                "result",
                                "source_status",
                                "group",
                                "wildcard",
                            ])
                                .optional(),
                            value: zod_1.z.string().optional(),
                            children: zod_1.z
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
                            parents: zod_1.z
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
                            children_depth: zod_1.z.number().optional(),
                            parents_depth: zod_1.z.number().optional(),
                            childrens_parents: zod_1.z
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
                            indirect_selection: zod_1.z.enum(["buildable", "cautious", "eager"]).optional(),
                        })
                            .catchall(zod_1.z.any()),
                    ])),
                ])),
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
    }))
        .min(1),
});
