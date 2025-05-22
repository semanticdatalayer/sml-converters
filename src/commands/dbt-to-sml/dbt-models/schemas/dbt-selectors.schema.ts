import { z } from "zod";

export const dbtSelectorsSchema = z.object({
  selectors: z
    .array(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        default: z
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
        definition: z
          .any()
          .superRefine((x, ctx) => {
            const schemas = [
              z
                .object({
                  method: z
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
                  value: z.string().optional(),
                  children: z
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
                  parents: z
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
                  children_depth: z.number().optional(),
                  parents_depth: z.number().optional(),
                  childrens_parents: z
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
                  indirect_selection: z.enum(["buildable", "cautious", "eager"]).optional(),
                })
                .catchall(z.any()),
              z.string(),
              z.array(
                z.union([
                  z.array(
                    z
                      .object({
                        method: z
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
                        value: z.string().optional(),
                        children: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                  schema.safeParse(x)
                                ),
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
                        parents: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                  schema.safeParse(x)
                                ),
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
                        children_depth: z.number().optional(),
                        parents_depth: z.number().optional(),
                        childrens_parents: z
                          .any()
                          .superRefine((x, ctx) => {
                            const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                            const errors = schemas.reduce(
                              (errors: z.ZodError[], schema) =>
                                ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                  schema.safeParse(x)
                                ),
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
                        indirect_selection: z.enum(["buildable", "cautious", "eager"]).optional(),
                      })
                      .catchall(z.any())
                  ),
                  z
                    .object({
                      method: z
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
                      value: z.string().optional(),
                      children: z
                        .any()
                        .superRefine((x, ctx) => {
                          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                          const errors = schemas.reduce(
                            (errors: z.ZodError[], schema) =>
                              ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                schema.safeParse(x)
                              ),
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
                      parents: z
                        .any()
                        .superRefine((x, ctx) => {
                          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                          const errors = schemas.reduce(
                            (errors: z.ZodError[], schema) =>
                              ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                schema.safeParse(x)
                              ),
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
                      children_depth: z.number().optional(),
                      parents_depth: z.number().optional(),
                      childrens_parents: z
                        .any()
                        .superRefine((x, ctx) => {
                          const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                          const errors = schemas.reduce(
                            (errors: z.ZodError[], schema) =>
                              ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                schema.safeParse(x)
                              ),
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
                      indirect_selection: z.enum(["buildable", "cautious", "eager"]).optional(),
                    })
                    .catchall(z.any()),
                  z.array(
                    z.union([
                      z.array(
                        z
                          .object({
                            method: z
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
                            value: z.string().optional(),
                            children: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                      schema.safeParse(x)
                                    ),
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
                            parents: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                      schema.safeParse(x)
                                    ),
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
                            children_depth: z.number().optional(),
                            parents_depth: z.number().optional(),
                            childrens_parents: z
                              .any()
                              .superRefine((x, ctx) => {
                                const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                                const errors = schemas.reduce(
                                  (errors: z.ZodError[], schema) =>
                                    ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                      schema.safeParse(x)
                                    ),
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
                            indirect_selection: z.enum(["buildable", "cautious", "eager"]).optional(),
                          })
                          .catchall(z.any())
                      ),
                      z
                        .object({
                          method: z
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
                          value: z.string().optional(),
                          children: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                    schema.safeParse(x)
                                  ),
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
                          parents: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                    schema.safeParse(x)
                                  ),
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
                          children_depth: z.number().optional(),
                          parents_depth: z.number().optional(),
                          childrens_parents: z
                            .any()
                            .superRefine((x, ctx) => {
                              const schemas = [z.string().regex(new RegExp("\\{\\{.*\\}\\}")), z.boolean()];
                              const errors = schemas.reduce(
                                (errors: z.ZodError[], schema) =>
                                  ((result) => ("error" in result ? [...errors, result.error] : errors))(
                                    schema.safeParse(x)
                                  ),
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
                          indirect_selection: z.enum(["buildable", "cautious", "eager"]).optional(),
                        })
                        .catchall(z.any()),
                    ])
                  ),
                ])
              ),
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
      })
    )
    .min(1),
});

export type DbtSelectors = z.infer<typeof dbtSelectorsSchema>;
