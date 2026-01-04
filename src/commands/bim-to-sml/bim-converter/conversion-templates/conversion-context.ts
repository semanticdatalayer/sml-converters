import { BimRoot } from "../../bim-models/bim-model";
import { SmlConverterResult } from "../../../../shared/sml-convert-result";
import { AttributeMaps } from "../../bim-models/types-and-interfaces";
import { MeasureConverter } from "../measure-converter";
import { Logger } from "../../../../shared/logger";
import { TemplateRegistry } from "./template-registry";

/**
 * ConversionContext provides shared state and dependencies for DAX to MDX conversion.
 *
 * Used by templates, converters, and the conversion pipeline to access:
 * - BIM model structure
 * - Conversion results accumulator
 * - Attribute mappings
 * - Logger
 *
 * Passed through the conversion pipeline to maintain consistency.
 */
export interface ConversionContext {
  /** BIM model being converted */
  bim: BimRoot;

  /** Original DAX expression being converted */
  daxExpression: string;

  /** Table name containing the measure */
  tableName: string;

  /** SML converter result accumulator */
  result: SmlConverterResult;

  /** Attribute mappings (dimension, metric lookups) */
  attrMaps: AttributeMaps;

  /** Set of tables not yet used in conversion */
  unusedTables: Set<string>;

  /** Measure converter instance */
  measureConverter: MeasureConverter;

  /** Logger instance */
  logger: Logger;

  /** Template registry for recursive template conversion */
  templateRegistry: TemplateRegistry;
}

/**
 * Creates a conversion context for measure conversion
 */
export function createConversionContext(
  bim: BimRoot,
  daxExpression: string,
  tableName: string,
  result: SmlConverterResult,
  attrMaps: AttributeMaps,
  unusedTables: Set<string>,
  measureConverter: MeasureConverter,
  logger: Logger,
  templateRegistry: TemplateRegistry,
): ConversionContext {
  return {
    bim,
    daxExpression,
    tableName,
    result,
    attrMaps,
    unusedTables,
    measureConverter,
    logger,
    templateRegistry,
  };
}
