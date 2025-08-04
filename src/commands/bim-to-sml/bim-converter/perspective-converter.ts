import {
  SMLModel,
  SMLModelPerspective,
  SMLPerspectiveDimension,
  SMLPerspectiveHierarchy,
} from "sml-sdk";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import {
  BimMeasure,
  BimPerspective,
  BimRoot,
  BimTable,
  BimTableColumn,
} from "../bim-models/bim-model";
import { uniqueNameForCreatedMeas } from "./converter-utils";
import { lookupAttrUniqueName } from "./tools";
import { findColumn } from "./converter-utils";
import { findMeasure } from "./converter-utils";
import { findAttrUse } from "./converter-utils";
import { makeUniqueName } from "./tools";
import {
  AttributeMaps,
  DimAttrsType,
  TableLists,
} from "../bim-models/types-and-interfaces";
import { aggFunctionAtStart } from "./expression-parser";
import { expressionAsString } from "./tools";
import { Logger } from "../../../shared/logger";

export class PerspectiveConverter {
  private logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }

  createPerspectives(
    bim: BimRoot,
    result: SmlConverterResult,
    attrMaps: AttributeMaps,
    tableLists: TableLists,
  ) {
    if (bim.model.perspectives != undefined) {
      bim.model.perspectives.forEach((ps) =>
        this.convertPerspectiveNew(
          ps,
          result,
          bim,
          attrMaps.attrNameMap,
          tableLists.unusedTables,
        ),
      );
    }
  }

  convertPerspectiveNew(
    bimPerspective: BimPerspective,
    result: SmlConverterResult,
    bim: BimRoot,
    attrNameMap: Map<string, string[]>,
    unusedTables: Set<string>,
  ): void {
    const model = result.models[0];
    const perspectiveUniqueName = makeUniqueName(
      `perspective.${bimPerspective.name}`,
    );
    const measures = new Array<string>();
    const dims = new Map<string, DimAttrsType>();

    bimPerspective.tables.forEach((pTable) => {
      // MEASURES
      if (unusedTables.has(pTable.name)) {
        const warnObjects: string[] = [];
        this.warnMissingInPerspective(
          pTable,
          warnObjects,
          perspectiveUniqueName,
        );
      } else {
        if (pTable.measures && pTable.measures.length > 0) {
          pTable.measures.forEach((pMeas) => {
            this.handleMeasureForPerspective(
              pMeas,
              pTable,
              bim,
              model,
              measures,
              bimPerspective,
              attrNameMap,
            );
          });
        }

        // Handle columns
        if (pTable.columns && pTable.columns.length > 0) {
          pTable.columns.forEach((pCol) => {
            this.handleColumnForPerspective(
              pTable,
              pCol,
              bim,
              model,
              dims,
              measures,
              result,
            );
          });
        }
      }
    });

    if (measures.length > 0 || dims.size > 0) {
      const smlPerspective = {
        unique_name: perspectiveUniqueName,
        metrics: measures.length > 0 ? measures : undefined,
      } satisfies SMLModelPerspective;

      if (dims.size > 0) {
        dims.forEach((val, key) => {
          this.handleDimForPerspective(val, key, smlPerspective, result);
        });
      }
      if (model.perspectives != undefined && smlPerspective?.unique_name) {
        model.perspectives.push(smlPerspective);
      }
    }
  }

  handleMeasureForPerspective(
    pMeas: BimMeasure,
    pTable: BimTable,
    bim: BimRoot,
    model: SMLModel,
    measures: string[],
    bimPerspective: BimPerspective,
    attrNameMap: Map<string, string[]>,
  ) {
    let aggFn = "";
    const origMeas = findMeasure(pMeas.name, bim);
    if (!origMeas) {
      this.logger.warn(
        `Can't find measure '${pMeas.name}' used by perspective '${bimPerspective.name}' so it will not be included`,
      );
      return;
    }
    if (origMeas?.expression)
      aggFn = aggFunctionAtStart(
        expressionAsString(origMeas.expression)
          .toLowerCase()
          .replace(/[' ]/g, ""),
      );
    const bimMeasName = lookupAttrUniqueName(
      attrNameMap,
      makeUniqueName(`metric.${pTable.name}.`) +
        pMeas.name +
        makeUniqueName(`.${aggFn && aggFn !== "none" ? "." + aggFn : ""}`),
      false,
      this.logger,
    );
    const bimCalcName = lookupAttrUniqueName(
      attrNameMap,
      makeUniqueName(`calculation.${pTable.name}.`) + pMeas.name,
      false,
      this.logger,
    );

    if (
      bimMeasName &&
      model.metrics.find((m) => m.unique_name.localeCompare(bimMeasName) == 0)
    ) {
      measures.push(bimMeasName);
    } else if (
      bimCalcName &&
      model.metrics.find((m) => m.unique_name.localeCompare(bimCalcName) == 0)
    ) {
      measures.push(bimCalcName);
    } else {
      // Need to check for case when bim measure is turned into a metric
      const createdMeasName = uniqueNameForCreatedMeas(
        pMeas.name,
        bim,
        attrNameMap,
        this.logger,
      );
      this.checkForBimMeasAsMetric(
        createdMeasName,
        measures,
        bimCalcName,
        bimMeasName,
        bimPerspective,
      );
    }
  }

  handleColumnForPerspective(
    pTable: BimTable,
    pCol: BimTableColumn,
    bim: BimRoot,
    model: SMLModel,
    dims: Map<string, DimAttrsType>,
    measures: string[],
    result: SmlConverterResult,
  ) {
    const origCol = findColumn(pTable.name, pCol.name, bim);
    let aggFn = "";
    if (origCol?.summarizeBy && origCol.summarizeBy !== "none")
      aggFn = origCol.summarizeBy;
    const bimMeasName =
      makeUniqueName(`metric.${pTable.name}.`) +
      pCol.name +
      makeUniqueName(`.${aggFn}`);

    if (
      aggFn &&
      model.metrics.find((m) => m.unique_name.localeCompare(bimMeasName) == 0)
    ) {
      measures.push(bimMeasName);
    }

    const bimAttrName =
      makeUniqueName(`dimension.${pTable.name}.attr.`) + pCol.name;
    const val = dims.get(pTable.name);
    const found = findAttrUse(bimAttrName, result);

    if (found === "level") {
      if (val) {
        val.levels.push(bimAttrName);
      } else {
        dims.set(pTable.name, { levels: [bimAttrName], attrs: [] });
      }
    } else if (found === "attr") {
      if (val) {
        val.attrs.push(bimAttrName);
      } else {
        dims.set(pTable.name, { levels: [], attrs: [bimAttrName] });
      }
    }
  }

  handleDimForPerspective(
    val: DimAttrsType,
    key: string,
    smlPerspective: SMLModelPerspective,
    result: SmlConverterResult,
  ) {
    const smlPerspectiveDim: SMLPerspectiveDimension = {
      name: makeUniqueName(`dimension.${key}`),
    };
    if (val?.attrs) {
      smlPerspectiveDim.secondary_attributes = val.attrs;
    }

    let hierUniqueName = makeUniqueName(`dimension.${key}.hierarchy.${key}`);
    // let hierUniqueName = hierNameFromDimAnd
    if (val?.levels && val.levels.length > 0) {
      const smlDim = result.dimensions.find((d) => d.label === key);
      if (smlDim) {
        smlDim.hierarchies.forEach((h) => {
          const smlLevel = h.levels.find(
            (l) => l.unique_name === val.levels[0],
          );
          if (smlLevel) hierUniqueName = h.unique_name;
        });
      }
      const perspectiveHier: SMLPerspectiveHierarchy = {
        name: hierUniqueName,
        level: val.levels[0], // TODO: use level intead of deprecated levels
      };
      if (!smlPerspectiveDim.hierarchies)
        smlPerspectiveDim.hierarchies = new Array<SMLPerspectiveHierarchy>();
      smlPerspectiveDim.hierarchies?.push(perspectiveHier);
    }
    if (!smlPerspective.dimensions)
      smlPerspective.dimensions = new Array<SMLPerspectiveDimension>();
    smlPerspective.dimensions?.push(smlPerspectiveDim);
  }

  warnMissingInPerspective(
    pTable: BimTable,
    warnObjects: string[],
    perspectiveName: string,
  ) {
    pTable.measures?.forEach((measure) => warnObjects.push(measure.name));
    if (warnObjects.length > 0) {
      this.logger.warn(
        `Perspective '${perspectiveName}' will not include the following measures from table '${
          pTable.name
        }' because the table is unused: ${warnObjects.join(", ")}`,
      );
    }
    warnObjects.length = 0;
    pTable.columns?.forEach((column) => warnObjects.push(column.name));
    if (warnObjects.length > 0) {
      this.logger.warn(
        `Perspective '${perspectiveName}' will not include the following columns from table '${
          pTable.name
        }' because the table is unused: ${warnObjects.join(", ")}`,
      );
    }
    warnObjects.length = 0;
    pTable.hierarchies?.forEach((hier) => warnObjects.push(hier.name));
    if (warnObjects.length > 0) {
      this.logger.warn(
        `Perspective '${perspectiveName}' will not include the following hierarchies from table '${
          pTable.name
        }' because the table is unused: ${warnObjects.join(", ")}`,
      );
    }
  }

  checkForBimMeasAsMetric(
    createdMeasName: string | undefined,
    measures: string[],
    bimCalcName: string | undefined,
    bimMeasName: string | undefined,
    bimPerspective: BimPerspective,
  ) {
    if (createdMeasName && !measures.includes(createdMeasName)) {
      measures.push(createdMeasName);
    } else if (createdMeasName) {
      // Not found
      this.logger.warn(
        `Can't find perspective metric with unique_name '${bimMeasName}', '${bimCalcName}', or '${createdMeasName}' used by bim perspective '${bimPerspective.name}' so not adding it to SML perspective`,
      );
    } else {
      this.logger.warn(
        `Can't find perspective metric with unique_name '${bimMeasName}' or '${bimCalcName}' used by bim perspective '${bimPerspective.name}' so not adding it to SML perspective`,
      );
    }
  }
}
