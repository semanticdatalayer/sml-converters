import { Logger } from "../../../shared/logger";
import { BimRoot, BimTable } from "../bim-models/bim-model";
import { TableLists } from "../bim-models/types-and-interfaces";
import { arrayToStringAlphabetical, setToStringAlphabetical } from "./tools";

/**
 * Check if a BIM table is a calculation group table.
 * Calculation group tables have a `calculationGroup` property.
 */
export function isCalculationGroupTable(table: BimTable): boolean {
  return table.calculationGroup !== undefined;
}

export class TableConverter {
  private logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Check if the BIM model has no relationships defined.
   * Returns true when `relationships` array is missing, undefined, or empty.
   */
  hasNoRelationships(bim: BimRoot): boolean {
    return (
      !bim.model.relationships ||
      !Array.isArray(bim.model.relationships) ||
      bim.model.relationships.length === 0
    );
  }

  /**
   * Identify and collect calculation group tables.
   * These tables should be skipped during dimension/dataset conversion.
   */
  collectCalculationGroupTables(bim: BimRoot, tableLists: TableLists): void {
    (bim.model.tables || []).forEach((table) => {
      if (isCalculationGroupTable(table)) {
        tableLists.calcGroupTables.add(table.name);
        tableLists.unusedTables.add(table.name);
        this.logger.info(
          `Skipping calculation group table: ${table.name}`,
        );
      }
    });

    if (tableLists.calcGroupTables.size > 0) {
      this.logger.info(
        `Found ${tableLists.calcGroupTables.size} calculation group table(s): ${setToStringAlphabetical(tableLists.calcGroupTables, ", ")}`,
      );
    }
  }

  listUnusedBimTables(
    bim: BimRoot,
    tableLists: TableLists,
    logger: Logger,
  ): void {
    // First, exclude tables with isPrivate: true (Power BI system tables like DateTableTemplate)
    this.listPrivateTables(bim, tableLists, logger);

    const tablesVariationsOnly: Array<string> = this.listTablesVariationsOnly(
      bim,
      tableLists.unusedTables,
    );
    if (tablesVariationsOnly.length > 0) {
      logger.warn(
        `The following BIM tables are used for variations only so will not be converted to SML:: ${arrayToStringAlphabetical(
          tablesVariationsOnly,
          ",",
        )}`,
      );
      tablesVariationsOnly.forEach((tbl) => tableLists.unusedTables.add(tbl));
    }

    // When no relationships exist, skip marking tables as unused based on relationships
    // Tables will be treated as standalone facts instead
    if (this.hasNoRelationships(bim)) {
      logger.info(
        "No relationships found in model - treating tables as standalone facts",
      );
      // Still run hidden column checks - tables excluded via isPrivate/isHidden remain excluded
      this.listTablesAllColsHidden(bim, tableLists, logger);
      return;
    }

    // These checks are run multiple times. There are cases where the listing of tables with all hidden objects
    // updates the list of unused tables which then means a different table needs to be removed
    this.listUnusedNoRelationships(bim, tableLists, logger);
    this.listTablesAllColsHidden(bim, tableLists, logger);
    this.listUnusedNoRelationships(bim, tableLists, logger);
    this.listTablesAllColsHidden(bim, tableLists, logger);
    this.listUnusedNoRelationships(bim, tableLists, logger);
  }

  /**
   * Exclude tables that are marked as private (isPrivate: true).
   * These are typically Power BI system tables like DateTableTemplate.
   */
  listPrivateTables(
    bim: BimRoot,
    tableLists: TableLists,
    logger: Logger,
  ): void {
    const privateTables: string[] = [];

    (bim.model.tables || []).forEach((tbl) => {
      if (tbl.isPrivate && !tableLists.unusedTables.has(tbl.name)) {
        tableLists.unusedTables.add(tbl.name);
        privateTables.push(tbl.name);
      }
    });

    if (privateTables.length > 0) {
      logger.info(
        `Excluding private tables (isPrivate: true):: ${arrayToStringAlphabetical(privateTables, ", ")}`,
      );
    }
  }

  listTablesVariationsOnly(
    bim: BimRoot,
    unusedTables: Set<string>,
  ): Array<string> {
    const tablesToRm = new Array<string>();

    (bim.model.tables || []).forEach((tbl) => {
      if (!unusedTables.has(tbl.name) && tbl.showAsVariationsOnly)
        tablesToRm.push(tbl.name);
    });
    return tablesToRm;
  }

  listUnusedNoRelationships(
    bim: BimRoot,
    tableLists: TableLists,
    logger: Logger,
  ): void {
    const used = new Set<string>();
    bim.model.relationships?.forEach((bimRelationship) => {
      if (
        !tableLists.unusedTables.has(bimRelationship.fromTable) &&
        !tableLists.unusedTables.has(bimRelationship.toTable)
      ) {
        used.add(bimRelationship.fromTable);
        used.add(bimRelationship.toTable);
      }
    });

    const msgUnused = new Set<string>();
    bim.model.tables?.forEach((bimTable) => {
      if (
        !used.has(bimTable.name) &&
        !tableLists.unusedTables.has(bimTable.name)
      ) {
        tableLists.unusedTables.add(bimTable.name);
        msgUnused.add(bimTable.name);
      }
    });

    if (msgUnused.size > 0)
      logger.warn(
        `No relationships found to or from the following table(s) so they will not be created:: ${setToStringAlphabetical(
          msgUnused,
          ", ",
        )}`,
      );
  }

  listTablesAllColsHidden(
    bim: BimRoot,
    tableLists: TableLists,
    logger: Logger,
  ): void {
    const msgUnused = new Set<string>();
    const tablesAllColsHidden = this.listTablesColsHidden(
      bim,
      tableLists.unusedTables,
    );
    if (tablesAllColsHidden.size > 0) {
      tablesAllColsHidden.forEach((tbl) => {
        if (!tableLists.unusedTables.has(tbl)) msgUnused.add(tbl);
        tableLists.unusedTables.add(tbl);
      });
    }
    if (msgUnused.size > 0) {
      logger.warn(
        `The following BIM tables have all columns hidden, no calculations or hierarchies referencing them, and are not on the left side of relationships. They will not be created:: ${setToStringAlphabetical(
          msgUnused,
          ", ",
        )}`,
      );
    }
  }

  // There are quite a few tables that are used by relationships and have all columns hidden
  // In some cases those columns are referenced by calculations, almost always when on left of join
  // During conversion don't include tables that have all columns hidden, are not used on left of relationship,
  // and are not referenced in calculations or hierarchies
  listTablesColsHidden(bim: BimRoot, unusedTables: Set<string>): Set<string> {
    const tablesToRm = new Set<string>();

    (bim.model.tables || []).forEach((tbl) => {
      if (!unusedTables.has(tbl.name)) {
        // Check that not on left of a relationship
        let onLeft = false;
        bim.model.relationships?.forEach((rel) => {
          if (rel.fromTable === tbl.name) onLeft = true;
        });
        if (!onLeft) {
          // Check if all columns are hidden
          let allHidden = true;
          (tbl.columns || []).forEach((col) => {
            if (!col.isHidden) {
              allHidden = false;
            }
          });
          if (allHidden) {
            // Check if referenced by calculations
            let used = false;
            (tbl.columns || []).forEach((col) => {
              (bim.model.tables || []).forEach((tbl2) => {
                (tbl2.measures || []).forEach((meas) => {
                  if (
                    meas.expression?.includes(`${tbl.name}[${col.name}]`) ||
                    meas.expression?.includes(`'${tbl.name}'[${col.name}]`)
                  )
                    used = true;
                });
              });

              // Check if used in hierarchies
              (tbl.hierarchies || []).forEach((hier) => {
                (hier.levels || []).forEach((level) => {
                  if (level.column === col.name) used = true;
                });
              });
            });

            if (!used) {
              tablesToRm.add(tbl.name);
            }
          }
        }
      }
    });
    return tablesToRm;
  }

  populateTableLists(bim: BimRoot, tableLists: TableLists) {
    // When no relationships exist, treat all non-excluded tables as fact tables
    if (this.hasNoRelationships(bim)) {
      (bim.model.tables || []).forEach((bimTable) => {
        if (!tableLists.unusedTables.has(bimTable.name)) {
          tableLists.factTables.push(bimTable);
        }
      });

      this.logger.info(
        `Standalone fact tables (no relationships):: ${arrayToStringAlphabetical(
          this.tablesToStringList(tableLists.factTables),
          ", ",
        )}`,
      );
      // dimTables remains empty - dimensions come from degenerate dims later
      return;
    }

    // If table is on left and not right, then fact
    // else if measures are on it then both fact and dim
    // else dim dataset
    if (bim.model.relationships) {
      bim.model.relationships.forEach((bimRelationship) => {
        if (
          !tableLists.unusedTables.has(bimRelationship.fromTable) &&
          !tableLists.unusedTables.has(bimRelationship.toTable)
        ) {
          const left = (bim.model.tables || []).find(
            (t) => t.name.localeCompare(bimRelationship.fromTable) == 0,
          );
          if (left) tableLists.leftTables.add(left.name);

          const right = (bim.model.tables || []).find(
            (t) => t.name.localeCompare(bimRelationship.toTable) == 0,
          );
          if (right) tableLists.rightTables.add(right.name);
        }
      });
    }

    (bim.model.tables || []).forEach((bimTable) => {
      // Always include tables that gave calculated measures
      if (!tableLists.unusedTables.has(bimTable.name)) {
        // Fact table because on left of joins but not right
        if (
          tableLists.leftTables.has(bimTable.name) &&
          !tableLists.rightTables.has(bimTable.name)
        ) {
          tableLists.factTables.push(bimTable);
        } else if (tableLists.measTables.has(bimTable.name)) {
          tableLists.factTables.push(bimTable);
          if (tableLists.rightTables.has(bimTable.name)) {
            tableLists.dimTables.push(bimTable);
          }
        } else {
          tableLists.dimTables.push(bimTable);
        }
      }
    });

    this.logger.info(
      `Tables used for fact datasets:: ${arrayToStringAlphabetical(
        this.tablesToStringList(tableLists.factTables),
        ", ",
      )}`,
    );
    this.logger.info(
      `Tables used for dimension datasets:: ${arrayToStringAlphabetical(
        this.tablesToStringList(tableLists.dimTables),
        ", ",
      )}`,
    );
  }

  tablesToStringList(factTables: BimTable[]): string[] {
    const factTablesList: string[] = [];
    factTables.forEach((f) => factTablesList.push(f.name));
    return factTablesList;
  }

  /**
   * Populate degenerate dimensions for standalone fact tables (no-relationships scenario).
   * Columns with summarizeBy: "none" or missing summarizeBy become degenerate dimension attributes.
   * This method should be called after datasets are created but before createDegenDimensions().
   */
  populateDegenDimsForStandaloneFacts(bim: BimRoot, tableLists: TableLists): void {
    // Only applies to no-relationships scenario
    if (!this.hasNoRelationships(bim)) {
      return;
    }

    const degenCols: string[] = [];

    for (const factTable of tableLists.factTables) {
      for (const column of factTable.columns || []) {
        // Skip hidden columns
        if (column.isHidden) continue;

        // Column is a degenerate dimension candidate if:
        // - summarizeBy is "none" (explicitly non-aggregatable)
        // - summarizeBy is missing/undefined (default to non-aggregatable for categorical data)
        const summarize = column.summarizeBy?.toLowerCase();
        if (!summarize || summarize === "none") {
          const degenKey = `${factTable.name}:${column.name}`;
          if (!tableLists.degenDims.has(degenKey)) {
            tableLists.degenDims.add(degenKey);
            degenCols.push(`${factTable.name}.${column.name}`);
          }
        }
      }
    }

    if (degenCols.length > 0) {
      this.logger.info(
        `Degenerate dimension columns (non-aggregatable):: ${degenCols.join(", ")}`,
      );
    }
  }
}
