import { z } from "zod";

import { dbtPackagesSchema } from "./schemas/dbt-packages.schema";

export type DbtPackages = z.infer<typeof dbtPackagesSchema>;
