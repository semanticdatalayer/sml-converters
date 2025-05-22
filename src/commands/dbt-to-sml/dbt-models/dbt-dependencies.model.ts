import { z } from "zod";

import { dbtDependenciesSchema } from "./schemas/dbt-dependencies.schema";

export type DbtDependencies = z.infer<typeof dbtDependenciesSchema>;
