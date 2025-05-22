import { z } from "zod";

export const dbtDependenciesSchema = z.object({
  projects: z.array(z.object({ name: z.string() })).optional(),
  packages: z
    .array(
      z.union([
        z.object({
          version: z
            .union([
              z.string().describe('A semantic version string or range, such as [">=1.0.0", "<2.0.0"]'),
              z.number().describe('A semantic version string or range, such as [">=1.0.0", "<2.0.0"]'),
              z.array(z.any()).describe('A semantic version string or range, such as [">=1.0.0", "<2.0.0"]'),
            ])
            .describe('A semantic version string or range, such as [">=1.0.0", "<2.0.0"]'),
          "install-prerelease": z.boolean().describe("Opt in to prerelease versions of a package").optional(),
          package: z
            .string()
            .regex(new RegExp("^[\\w\\-\\.]+/[\\w\\-\\.]+$"))
            .describe(
              "Must be in format `org_name/package_name`. Refer to hub.getdbt.com for installation instructions"
            ),
        }),
        z.object({
          git: z.string(),
          revision: z
            .string()
            .describe("Pin your package to a specific release by specifying a release name")
            .optional(),
          subdirectory: z
            .string()
            .describe("Only required if the package is nested in a subdirectory of the git project")
            .optional(),
        }),
        z.object({ local: z.string().optional() }),
      ])
    )
    .min(1)
    .optional(),
});
