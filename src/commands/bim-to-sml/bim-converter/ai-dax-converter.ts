import { ax, AxAI, f } from "@ax-llm/ax";
import { Logger } from "../../../shared/logger";
import { makeUniqueName } from "./tools";

const supportedLLMs = {
  openai: "openai",
  anthropic: "anthropic",
  gemini: "gemini",
};

/**
 * Interface representing a converter that transforms DAX expressions into MDX expressions using AI.
 *
 * @interface AiDaxToMdxConverter
 * @method convert - Converts a DAX expression to an MDX expression.
 * @method validateConfig - Validates that the necessary configuration (like API keys) is set.
 */
interface AiDaxToMdxConverter {
  /**
   * Converts a DAX expression to an MDX expression.
   * @param daxExpression - The DAX expression to be converted
   */
  convert(daxExpression: string): Promise<string | undefined>;
  /**
   * Validates that the necessary configuration (like API keys) is set.
   * @Error is thrown if configuration is invalid.
   */
  validateConfig(): void;
}

export class AnthropicDaxToMdxConverter implements AiDaxToMdxConverter {
  constructor(private readonly logger: Logger) {}

  async convert(daxExpression: string): Promise<string | undefined> {
    const llm = AxAI.create({
      name: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY! as string,
    });
    return aiConvertDaxToMdx(llm, daxExpression);
  }

  validateConfig() {
    if (!process.env.ANTHROPIC_API_KEY) {
      this.logger.error(
        "Anthropic API key is not set. Please set the ANTHROPIC_API_KEY environment variable.",
      );
      throw new Error("Missing Anthropic API key");
    }
  }
}

export class OpenAIDaxToMdxConverter implements AiDaxToMdxConverter {
  constructor(private readonly logger: Logger) {}

  async convert(daxExpression: string): Promise<string | undefined> {
    const llm = AxAI.create({
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY! as string,
    });
    return aiConvertDaxToMdx(llm, daxExpression);
  }

  validateConfig() {
    if (!process.env.OPENAI_API_KEY) {
      this.logger.error(
        "OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable.",
      );
      throw new Error("Missing OpenAI API key");
    }
  }
}

export class GeminikDaxToMdxConverter implements AiDaxToMdxConverter {
  constructor(private readonly logger: Logger) {}

  async convert(daxExpression: string): Promise<string | undefined> {
    const llm = AxAI.create({
      name: "google-gemini",
      apiKey: process.env.GEMINI_API_KEY! as string,
    });
    return aiConvertDaxToMdx(llm, daxExpression);
  }

  validateConfig() {
    if (!process.env.GEMINI_API_KEY) {
      this.logger.error(
        "Gemini API key is not set. Please set the GEMINI_API_KEY environment variable.",
      );
      throw new Error("Missing Gemini API key");
    }
  }
}

const llmMap: Record<string, new (logger: Logger) => AiDaxToMdxConverter> = {
  anthropic: AnthropicDaxToMdxConverter,
  openai: OpenAIDaxToMdxConverter,
  gemini: GeminikDaxToMdxConverter,
};

async function aiConvertDaxToMdx(
  llm: AxAI,
  daxExpression: string,
  rules?: string,
): Promise<string | undefined> {
  const sig = f()
    .input(
      "daxExpression",
      f.string("DAX expression to be translated into MDX"),
    )
    .input("rules", f.string("Rules to follow for the conversion"))
    .output("mdxExpression", f.string("Converted MDX expression"))
    .output(
      "difficulty",
      f.number(
        "Difficulty score 0-1 on how difficult the conversion is, 0 being easy and 1 being extremely difficult. Use 2 significant figures",
      ),
      true,
    )
    .output("reasoning", f.string("Internal reasoning").internal())
    .description(
      "Converts a Data Analysis Expressions(DAX) expression to a MultiDimentional Expression(MDX)",
    )
    .build();

  const gen = ax(sig, { ai: llm });

  console.log(
    `    Converting DAX to MDX using AI with expression: ${
      daxExpression.length > 175
        ? daxExpression.substring(0, 175) + "..."
        : daxExpression
    }`,
  );
  const res = await gen.forward(llm, {
    daxExpression: daxExpression,
    rules: rules ? rules : basicRules,
  });
  console.log(`   res.difficulty: ${res.difficulty}`);
  if (res.difficulty > 0.7) {
    return undefined; // Too difficult to convert, ai most likely got it wrong
  }

  let mdxExpression = res.mdxExpression;
  mdxExpression +=
    " /* TODO: Converted from DAX To MDX using AI - please validate. Original DAX: " +
    daxExpression +
    " */";
  console.log(
    `   returning mdxExpression: ${
      mdxExpression.length > 175
        ? mdxExpression.substring(0, 175) + "..."
        : mdxExpression
    }`,
  );
  return mdxExpression;
}

const basicRules =
  "You are a converter that converts a Data Analysis Expressions(DAX) expression to a MultiDimentional Expression(MDX).\n" +
  "All Aggregated DAX columns are columns within a Measures dimension. Ex: SUM('ABCD'[SalesCreditUSD]) --> [Measures].[SalesCreditUSD].\n" +
  "All table names and column names maintain their spaces, periods, and other special characters. Ex: Sum('ABCD'[.Forecast Cost]) --> [Measures].[.Forecast Cost]\n" +
  "DO NOT use the FILTER function in the MDX expression, instead use tuples to fix the context.\n" +
  "Use MDX syntax standards.\n" +
  "Do not use curly braces '{}' in the MDX expression.\n" +
  "If the DAX expression uses variables, make the difficulty score 1 and return an empty MDX expression.\n";

/**
 * Creates an AI converter instance based on the specified LLM (Language Learning Model) name.
 *
 * @param llmName - The name of the Language Learning Model to use for conversion
 * @param logger - Logger instance for handling logging operations
 * @returns An instance of AiDaxToMdxConverter if the LLM name is valid, undefined otherwise
 */
export function getAiConverter(
  llmName: string,
  logger: Logger,
): AiDaxToMdxConverter {
  if (Object.keys(llmMap).includes(llmName.toLowerCase())) {
    const AiConverterClass = llmMap[llmName.toLowerCase()];
    return new AiConverterClass(logger);
  }
  logger.error(
    `LLM name "${llmName}" is not supported. Supported LLMs are: ${Object.keys(
      supportedLLMs,
    ).join(", ")}`,
  );
  throw Error(`LLM name "${llmName}" is not supported.`);
}

export async function convertDaxToMdxWithAi(
  daxExpression: string,
  llmName: any,
  logger: Logger,
): Promise<string | undefined> {
  // console.log(`Converting DAX to MDX using LLM: ${llmName}`);
  let converter: AiDaxToMdxConverter = getAiConverter(llmName, logger)!;
  converter.validateConfig();
  const mdxExpression = await converter.convert(daxExpression);
  // console.log(
  //   `Conversion complete. DAX: ${daxExpression} --> MDX: ${mdxExpression}`,
  // );
  return mdxExpression;
}

/**
 * Processes an MDX expression to replace table references and track used measures.
 *
 * @param mdxExpression - The MDX expression to process
 * @returns An object containing:
 *  - usedMeasures: A Set of tuples containing [table, column] pairs that were found and validated
 *  - updatedMdxExpression: The processed MDX expression with table references replaced
 **/
export function replaceUsedMeasures(mdxExpression: string): {
  usedMeasures: Set<[string, string]>;
  updatedMdxExpression: string;
} {
  const regex = /\[([^\]]+)\]\.\[([^\]]+)\]/g;

  const tableColumnSet = new Set<[string, string]>();
  let matches;
  while ((matches = regex.exec(mdxExpression)) !== null) {
    tableColumnSet.add([matches[1], matches[2]]);
  }
  const newTableColumnSet = new Set<[string, string]>();
  for (const [tbl, col] of tableColumnSet) {
    if (
      hasValidParenthesesAndBrackets(tbl) &&
      hasValidParenthesesAndBrackets(col) &&
      tbl !== "Measures"
    ) {
      // Both key and value have valid parentheses
      mdxExpression = mdxExpression.replaceAll(
        `[${tbl}].[${col}]`,
        `[${makeUniqueName(`dimension.${tbl}`)}].[${col}]`,
      );
      newTableColumnSet.add([tbl, col]);
    }
  }
  return {
    usedMeasures: newTableColumnSet,
    updatedMdxExpression: mdxExpression,
  };
}

/**
 * Extracts table and column names from a DAX expression using regular expressions.
 *
 * The regex pattern matches expressions in the format "TableName[ColumnName]" where:
 * - TableName must start with a letter or underscore, followed by letters, numbers, or underscores
 * - ColumnName is any text between square brackets (excluding nested brackets)
 *
 * @param daxExpression - The DAX expression to parse
 * @returns A Set of tuples containing [tableName, columnName] pairs found in the expression
 */
export function getTableColumnFromDax(
  daxExpression: string,
): Set<[string, string]> {
  const regex = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\[\s*([^\[\]]+?)\s*\]/g;

  const tableColumnSet = new Set<[string, string]>();
  let matches;
  while ((matches = regex.exec(daxExpression)) !== null) {
    tableColumnSet.add([matches[1], matches[2]]);
  }
  return tableColumnSet;
}

export function getUsedMeasures(mdxExpression: string): string[] {
  const usedMeasures: string[] = [];
  const regex = /\[Measures\]\.\[(.*?)\]/g;
  let match;
  while ((match = regex.exec(mdxExpression)) !== null) {
    if (match[1]) {
      usedMeasures.push(match[1]);
    }
  }
  return usedMeasures;
}

function hasValidParenthesesAndBrackets(input: string): boolean {
  input = input.trim();
  let parenCount = 0;
  let bracketCount = 0;

  for (const char of input) {
    if (char === "(") {
      parenCount++;
    } else if (char === ")") {
      parenCount--;
      if (parenCount < 0) return false;
    } else if (char === "[") {
      bracketCount++;
    } else if (char === "]") {
      bracketCount--;
      if (bracketCount < 0) return false;
    }
  }

  return parenCount === 0 && bracketCount === 0;
}
