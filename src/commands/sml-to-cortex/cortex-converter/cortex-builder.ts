import {
  SMLDimension,
  SMLDimensionLevelAttribute,
  SMLDimensionSecondaryAttribute,
} from "sml-sdk";

import { sortAlphabetically } from "../../../shared/array-util";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import {
  CortexDimension,
  CortexMeasure,
  CortexTable,
  CortexTimeDimension,
} from "../cortex-models/CortexModel";
import { listTimeColumns, listNumericColumns } from "./cortex-analysis";
import {
  mapToSnowDim,
  mapToSnowMeasure,
  mapToSnowTimeDim,
} from "./cortex-mapper";
import { getAllLevels } from "./cortex-sml-processor";
import { fmtForMsg } from "./cortex-tools";

export interface PassDimsAndCols {
  timeColumns: Set<string>;
  numericColumns: Set<string>;
  snowDims: Array<CortexDimension>;
  snowTimeDims: Array<CortexTimeDimension>;
  unsupported_aggregation: Array<string>;
}

export function addMeasures(
  modelObjects: SmlConverterResult,
  newTable: CortexTable,
  mapDatasetsToDims: Map<string, Set<string>>,
  attrUniqueNames: Set<string>,
  logger: Logger,
) {
  const measMsgs = new Array<string>();
  let unsupported_aggregation = new Array<string>();

  modelObjects.measures.forEach((measure) => {
    if (!measure.is_hidden) {
      if (!newTable.measures) newTable.measures = [];
      newTable.measures.push(
        mapToSnowMeasure(
          measure,
          mapDatasetsToDims,
          unsupported_aggregation,
          attrUniqueNames,
          logger,
        ),
      );
    } else {
      measMsgs.push(fmtForMsg(measure));
    }
  });
  if (measMsgs.length > 0) {
    logger.info(
      `Measures found which are hidden so they will not be included in the conversion: ${sortAlphabetically(
        measMsgs,
        (n) => n,
      ).join(", ")}`,
    );
  }
  if (unsupported_aggregation.length > 0) {
    unsupported_aggregation = unsupported_aggregation.sort((a, b) =>
      a.localeCompare(b),
    );
    logger.warn(
      `The following measures were found with an unsupported aggregation type so no 'default_aggregation' property will be defined: ${unsupported_aggregation.join(
        ", ",
      )}`,
    );
  }
}

export function addCalculations(
  modelObjects: SmlConverterResult,
  newTable: CortexTable,
  mapDatasetsToDims: Map<string, Set<string>>,
  attrUniqueNames: Set<string>,
  logger: Logger,
) {
  const calcMsgs = new Array<string>();
  modelObjects.measuresCalculated.forEach((calc) => {
    if (!calc.is_hidden) {
      if (!newTable.measures) newTable.measures = [];
      // There's no default_aggregation in calculations so no messages are tracked for them
      newTable.measures.push(
        mapToSnowMeasure(
          calc,
          mapDatasetsToDims,
          new Array<string>(),
          attrUniqueNames,
          logger,
        ),
      );
    } else {
      calcMsgs.push(fmtForMsg(calc));
    }
  });
  if (calcMsgs.length > 0) {
    logger.info(
      `Calculations found which are hidden so they will not be included in the conversion: ${sortAlphabetically(
        calcMsgs,
        (n) => n,
      ).join(", ")}`,
    );
  }
}

export function addDimensions(
  smlObjects: SmlConverterResult,
  modelObjects: SmlConverterResult,
  newTable: CortexTable,
  rolePlays: Set<string>,
  mapDatasetsToDims: Map<string, Set<string>>,
  attrUniqueNames: Set<string>,
  logger: Logger,
) {
  const dimsAndColsToPass: PassDimsAndCols = {
    timeColumns: listTimeColumns(smlObjects),
    numericColumns: listNumericColumns(smlObjects),
    snowDims: new Array<CortexDimension>(),
    snowTimeDims: new Array<CortexTimeDimension>(),
    unsupported_aggregation: new Array<string>(),
  };
  modelObjects.dimensions.forEach((dim) => {
    addSnowDimsFromSmlDim(
      dim,
      dimsAndColsToPass,
      newTable.measures,
      rolePlays,
      mapDatasetsToDims,
      attrUniqueNames,
      logger,
    );
  });
  if (dimsAndColsToPass.snowDims.length > 0)
    newTable.dimensions = dimsAndColsToPass.snowDims;
  if (dimsAndColsToPass.snowTimeDims.length > 0)
    newTable.time_dimensions = dimsAndColsToPass.snowTimeDims;
}

function addSnowDimsFromSmlDim(
  dim: SMLDimension,
  dimsAndColsToPass: PassDimsAndCols,
  snowMeasures: CortexMeasure[],
  rolePlays: Set<string>,
  mapDatasetsToDims: Map<string, Set<string>>,
  attrUniqueNames: Set<string>,
  logger: Logger,
) {
  const msgs = new Array<string>();

  if (dim.is_degenerate) {
    dim.level_attributes.forEach((attribute) =>
      addIfNotHidden(
        attribute,
        dimsAndColsToPass,
        "",
        msgs,
        attrUniqueNames,
        logger,
      ),
    );
    getAllLevels(dim).forEach((level) => {
      level.secondary_attributes?.forEach((secondary) =>
        addIfNotHidden(
          secondary,
          dimsAndColsToPass,
          "",
          msgs,
          attrUniqueNames,
          logger,
        ),
      );
    });
  } else {
    const roleplays = new Set<string>();
    rolePlays.forEach((roleplay) => {
      if (roleplay.startsWith(dim.unique_name))
        roleplays.add(
          roleplay.includes("|")
            ? roleplay.substring(roleplay.indexOf("|") + 1)
            : "{0}",
        );
    });

    roleplays.forEach((roleplay) => {
      dim.level_attributes.forEach((attribute) =>
        addIfNotHidden(
          attribute,
          dimsAndColsToPass,
          roleplay,
          msgs,
          attrUniqueNames,
          logger,
        ),
      );
      getAllLevels(dim).forEach((level) => {
        level.secondary_attributes?.forEach((secondary) =>
          addIfNotHidden(
            secondary,
            dimsAndColsToPass,
            roleplay,
            msgs,
            attrUniqueNames,
            logger,
          ),
        );
        level.aliases?.forEach((alias) =>
          addIfNotHidden(
            alias,
            dimsAndColsToPass,
            roleplay,
            msgs,
            attrUniqueNames,
            logger,
          ),
        );
        level.metrics?.forEach((metric) =>
          snowMeasures.push(
            mapToSnowMeasure(
              metric,
              mapDatasetsToDims,
              dimsAndColsToPass.unsupported_aggregation,
              attrUniqueNames,
              logger,
            ),
          ),
        );
      });
    });
  }
  if (msgs.length > 0) {
    logger.info(
      `Attributes in dimension '${fmtForMsg(
        dim,
      )}' found which are hidden so they will not be included in the conversion: ${sortAlphabetically(
        msgs,
        (n) => n,
      ).join(", ")}`,
    );
  }
  if (dimsAndColsToPass.unsupported_aggregation.length > 0) {
    const sorted = sortAlphabetically(
      dimsAndColsToPass.unsupported_aggregation,
      (n) => n,
    );
    logger.warn(
      `The following metrical attributes were found with an unsupported aggregation type so no 'default_aggregation' property will be defined: ${sorted.join(
        ", ",
      )}`,
    );
  }
}

function addIfNotHidden(
  dimAttr: SMLDimensionLevelAttribute | SMLDimensionSecondaryAttribute,
  dimsAndColsToPass: PassDimsAndCols,
  role: string,
  msgs: Array<string>,
  attrUniqueNames: Set<string>,
  logger: Logger,
) {
  if (role === "") role = "{0}";
  if (!dimAttr.is_hidden) {
    if (
      "dataset" in dimAttr &&
      dimsAndColsToPass.timeColumns.has(
        `${dimAttr.dataset}.${dimAttr.name_column}`,
      )
    ) {
      dimsAndColsToPass.snowTimeDims.push(
        mapToSnowTimeDim(dimAttr, role, attrUniqueNames, logger),
      );
    } else {
      dimsAndColsToPass.snowDims.push(
        mapToSnowDim(
          dimAttr,
          role,
          dimsAndColsToPass.numericColumns,
          attrUniqueNames,
          logger,
        ),
      );
    }
  } else {
    msgs.push(fmtForMsg(dimAttr));
  }
}
