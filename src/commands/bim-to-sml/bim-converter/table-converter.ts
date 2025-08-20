import { Logger } from "../../../shared/logger";
import { BimRoot, BimTable } from "../bim-models/bim-model";
import { TableLists } from "../bim-models/types-and-interfaces";
import { arrayToStringAlphabetical, setToStringAlphabetical } from "./tools";

export class TableConverter {
  private logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }

  listUnusedBimTables(
    bim: BimRoot,
    tableLists: TableLists,
    logger: Logger,
  ): void {
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

    // These checks are run multiple times. There are cases where the listing of tables with all hidden objects
    // updates the list of unused tables which then means a different table needs to be removed
    this.listUnusedNoRelationships(bim, tableLists, logger);
    this.listTablesAllColsHidden(bim, tableLists, logger);
    this.listUnusedNoRelationships(bim, tableLists, logger);
    this.listTablesAllColsHidden(bim, tableLists, logger);
    this.listUnusedNoRelationships(bim, tableLists, logger);
  }

  listTablesVariationsOnly(
    bim: BimRoot,
    unusedTables: Set<string>,
  ): Array<string> {
    const tablesToRm = new Array<string>();

    bim.model.tables.forEach((tbl) => {
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

    bim.model.tables.forEach((tbl) => {
      if (!unusedTables.has(tbl.name)) {
        // Check that not on left of a relationship
        let onLeft = false;
        bim.model.relationships?.forEach((rel) => {
          if (rel.fromTable === tbl.name) onLeft = true;
        });
        if (!onLeft) {
          // Check if all columns are hidden
          let allHidden = true;
          tbl.columns.forEach((col) => {
            if (!col.isHidden) {
              allHidden = false;
            }
          });
          if (allHidden) {
            // Check if referenced by calculations
            let used = false;
            tbl.columns.forEach((col) => {
              bim.model.tables.forEach((tbl2) => {
                tbl2.measures?.forEach((meas) => {
                  if (
                    meas.expression.includes(`${tbl.name}[${col.name}]`) ||
                    meas.expression.includes(`'${tbl.name}'[${col.name}]`)
                  )
                    used = true;
                });
              });

              // Check if used in hierarchies
              tbl.hierarchies?.forEach((hier) => {
                hier.levels.forEach((level) => {
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
    // If table is on left and not right, then fact
    // else if measures are on it then both fact and dim
    // else dim dataset
    if (bim.model.relationships) {
      bim.model.relationships.forEach((bimRelationship) => {
        if (
          !tableLists.unusedTables.has(bimRelationship.fromTable) &&
          !tableLists.unusedTables.has(bimRelationship.toTable)
        ) {
          const left = bim.model.tables.find(
            (t) => t.name.localeCompare(bimRelationship.fromTable) == 0,
          );
          if (left) tableLists.leftTables.add(left.name);

          const right = bim.model.tables.find(
            (t) => t.name.localeCompare(bimRelationship.toTable) == 0,
          );
          if (right) tableLists.rightTables.add(right.name);
        }
      });
    }

    bim.model.tables.forEach((bimTable) => {
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
}
