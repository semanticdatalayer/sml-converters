import z from "zod";

export const noneEmptyString = z.string().min(1);
const emptyString = z.string().max(0);

const baseUniqueNameObjectSchema = z.object({ unique_name: z.string() });

const modelRegularRelationshipOrphanFrom = baseUniqueNameObjectSchema.extend({
  from: z.object({
    dataset: emptyString,
    join_columns: z.array(z.string()).length(0),
  }),
  to: z.object({
    dimension: noneEmptyString,
    level: z.string(),
  }),
});

const modelRegularRelationshipOrphanTo = baseUniqueNameObjectSchema.extend({
  from: z.object({
    dataset: noneEmptyString,
    join_columns: z.array(z.string()).length(0),
  }),
  to: z.object({
    dimension: emptyString,
    level: emptyString,
  }),
});

const modelSecurityRelationshipOrphanTo = baseUniqueNameObjectSchema.extend({
  from: z.object({
    dataset: noneEmptyString,
    join_columns: z.array(z.string()),
  }),
  to: z.object({
    row_security: emptyString,
  }),
});

const modelSecurityRelationshipOrphanFrom = baseUniqueNameObjectSchema.extend({
  from: z.object({
    dataset: emptyString,
    join_columns: z.array(z.string()).length(0),
  }),
  to: z.object({
    row_security: noneEmptyString,
  }),
});

const dimensionSecurityRelationshipOrphanTo = baseUniqueNameObjectSchema.extend({
  from: z.object({
    dataset: noneEmptyString,
    hierarchy: z.string(),
    level: z.string(),
    join_columns: z.array(z.string()),
  }),
  to: z.object({
    row_security: emptyString,
  }),
});

const dimensionSecurityRelationshipOrphanFrom = baseUniqueNameObjectSchema.extend({
  from: z.object({
    dataset: emptyString,
    hierarchy: emptyString,
    level: emptyString,
    join_columns: z.array(z.string()).length(0),
  }),
  to: z.object({
    row_security: noneEmptyString,
  }),
});

const snowflakeRelationshipOrphanFrom = z.object({
  from: z.object({
    dataset: emptyString,
    join_columns: z.array(z.string()).length(0),
  }),
  to: z.object({ level: noneEmptyString }),
});

const snowflakeRelationshipOrphanTo = z.object({
  from: z.object({
    dataset: noneEmptyString,
    join_columns: z.array(z.string()),
  }),
  to: z.object({ level: emptyString }),
});

const EmbeddedRelationshipOrphanFrom = dimensionSecurityRelationshipOrphanFrom.extend({
  to: z.object({ level: z.string(), dimension: z.string() }),
});
const EmbeddedRelationshipOrphanTo = dimensionSecurityRelationshipOrphanTo.extend({
  to: z.object({ level: emptyString, dimension: emptyString }),
});

// regular relationships
export const modelOrphanRegularSchema = modelRegularRelationshipOrphanFrom.or(modelRegularRelationshipOrphanTo);

//security relationships
export const modelOrphanSecuritySchema = modelSecurityRelationshipOrphanFrom.or(modelSecurityRelationshipOrphanTo);

// regular relationships
export const dimensionSnowflakeOrphanSchema = snowflakeRelationshipOrphanFrom.or(snowflakeRelationshipOrphanTo);

export const dimensionEmbededOrphanSchema = EmbeddedRelationshipOrphanFrom.or(EmbeddedRelationshipOrphanTo);

//security relationships
export const dimensionSecurityOrphanSchema = dimensionSecurityRelationshipOrphanFrom.or(
  dimensionSecurityRelationshipOrphanTo
);
