export class Constants {
  public static readonly CONN_ID = "Postgres";
  public static readonly AGG_FNS = [
    "sum",
    "countrows",
    "isblank",
    "min",
    "max",
    "distinctcount",
    "count",
  ];
  public static readonly NAMED_FORMATS = [
    "percent",
    "custom",
    "general number",
    "standard",
    "scientific",
    "fixed",
    "currency",
    "general date",
    "long date",
    "medium date",
    "short date",
    "long time",
    "medium time",
    "short time",
    "yes/no",
    "true/false",
    "on/off",
  ];
  public static readonly ROW_COUNT_COLUMN_NAME = "countrows1";
  public static readonly ILLEGAL_FILENAME_CHARS = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 34, 42, 47, 58, 60, 62, 63, 92,
    124,
  ];
  public static readonly MAX_UNIQUE_NAME_LENGTH = 63;
}
