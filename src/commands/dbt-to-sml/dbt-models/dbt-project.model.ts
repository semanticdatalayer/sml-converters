import { z } from "zod";

import { dbtProjectSchema } from "./schemas/dbt-project.schema";

export type DbtProject = z.infer<typeof dbtProjectSchema>;
