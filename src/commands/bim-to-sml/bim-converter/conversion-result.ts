/**
 * Result of DAX to MDX conversion attempt
 */
export interface ConversionResult {
  /** Whether conversion succeeded */
  success: boolean;

  /** Converted MDX expression (if successful) */
  expression?: string;

  /** Conversion confidence score (0.0-1.0) */
  confidence: number;

  /** Category of conversion method used */
  category: ConversionCategory;

  /** Optional metadata about conversion */
  metadata?: {
    /** Original DAX expression */
    originalDax?: string;

    /** Conversion method details */
    method?: string;

    /** Any warnings or notes */
    warnings?: string[];

    /** Variables inlined during conversion */
    varsInlined?: number;

    /** Additional metadata fields */
    [key: string]: any;
  };

  /** Error message if conversion failed */
  error?: string;
}

/**
 * Categories of DAX to MDX conversion methods
 */
export enum ConversionCategory {
  /** Simple 1:1 function mapping (confidence: 1.0) */
  DIRECT_CONVERSION = "direct_conversion",

  /** Pattern-based template conversion (confidence: 0.85-1.0) */
  TEMPLATE_CONVERSION = "template_conversion",

  /** VAR inlining enabled successful conversion (confidence: varies) */
  VAR_INLINED = "var_inlined",

  /** AI/LLM-based conversion (confidence: 0.0-0.7) */
  AI_CONVERSION = "ai_conversion",

  /** Not converted, fallback to TODO stub (confidence: 0.0) */
  UNCONVERTIBLE = "unconvertible",
}

/**
 * Creates a failed conversion result
 */
export function failedConversion(
  error: string,
  originalDax?: string,
): ConversionResult {
  return {
    success: false,
    confidence: 0.0,
    category: ConversionCategory.UNCONVERTIBLE,
    error,
    metadata: originalDax ? { originalDax } : undefined,
  };
}

/**
 * Creates a successful conversion result
 */
export function successfulConversion(
  expression: string,
  confidence: number,
  category: ConversionCategory,
  metadata?: ConversionResult["metadata"],
): ConversionResult {
  return {
    success: true,
    expression,
    confidence,
    category,
    metadata,
  };
}
