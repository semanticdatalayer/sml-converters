"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbtDependenciesSchema = void 0;
const zod_1 = require("zod");
exports.dbtDependenciesSchema = zod_1.z.object({
    projects: zod_1.z.array(zod_1.z.object({ name: zod_1.z.string() })).optional(),
    packages: zod_1.z
        .array(zod_1.z.union([
        zod_1.z.object({
            version: zod_1.z
                .union([
                zod_1.z.string().describe('A semantic version string or range, such as [">=1.0.0", "<2.0.0"]'),
                zod_1.z.number().describe('A semantic version string or range, such as [">=1.0.0", "<2.0.0"]'),
                zod_1.z.array(zod_1.z.any()).describe('A semantic version string or range, such as [">=1.0.0", "<2.0.0"]'),
            ])
                .describe('A semantic version string or range, such as [">=1.0.0", "<2.0.0"]'),
            "install-prerelease": zod_1.z.boolean().describe("Opt in to prerelease versions of a package").optional(),
            package: zod_1.z
                .string()
                .regex(new RegExp("^[\\w\\-\\.]+/[\\w\\-\\.]+$"))
                .describe("Must be in format `org_name/package_name`. Refer to hub.getdbt.com for installation instructions"),
        }),
        zod_1.z.object({
            git: zod_1.z.string(),
            revision: zod_1.z
                .string()
                .describe("Pin your package to a specific release by specifying a release name")
                .optional(),
            subdirectory: zod_1.z
                .string()
                .describe("Only required if the package is nested in a subdirectory of the git project")
                .optional(),
        }),
        zod_1.z.object({ local: zod_1.z.string().optional() }),
    ]))
        .min(1)
        .optional(),
});
