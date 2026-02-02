# For use in Windows running against Power BI Desktop

import argparse
import clr
clr.AddReference(r"C:\Program Files (x86)\Microsoft.NET\ADOMD.NET\130\Microsoft.AnalysisServices.AdomdClient.dll")

import json
import glob
import os
from decimal import Decimal
from pathlib import Path
from pyadomd import Pyadomd
import re
from datetime import datetime, date

# Path to test directories relative to this script
# TEST_MODEL_DIR = Path(__file__).parent.parent / "src" / "test-suites" / "pbi-smoke" / "dw-test-model"
# TEST_MODEL_DIR = Path(r"C:\Users\dianne\dw-test-model")
TEST_MODEL_DIR = Path(r"\\Mac\Home\Downloads\pbi-results\pbi-smoke\dw-test-model")

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

def discover_tests() -> dict[str, str]:
    """Walk dw-test-model/*/ directories and read pbi.dax files.

    Returns:
        Dict mapping test_name to dax_expression
    """
    queries: dict[str, str] = {}

    if not TEST_MODEL_DIR.exists():
        raise RuntimeError(f"Test model directory not found: {TEST_MODEL_DIR}")

    for test_dir in sorted(TEST_MODEL_DIR.iterdir()):
        if not test_dir.is_dir():
            continue

        pbi_dax_path = test_dir / "pbi.dax"
        if not pbi_dax_path.exists():
            continue

        dax_content = pbi_dax_path.read_text(encoding="utf-8").strip()
        test_name = test_dir.name
        queries[test_name] = dax_content

    return queries

def get_pbi_connection_string():
    user = os.environ["USERPROFILE"]
    pattern = (
        rf"{user}\AppData\Local\Microsoft\Power BI Desktop"
        r"\AnalysisServicesWorkspaces\*\Data\msmdsrv.port.txt"
    )
    files = glob.glob(pattern)
    if not files:
        raise RuntimeError("Power BI Desktop doesn't appear to be running")

    port_file = max(files, key=os.path.getmtime)

    # Read raw bytes so we can handle UTF-16-with-NULs reliably
    with open(port_file, "rb") as f:
        b = f.read()

    # Try decode as UTF-16 first (common for this file), fall back to ASCII/UTF-8
    port_raw = None
    for enc in ("utf-16", "utf-8", "ascii"):
        try:
            port_raw = b.decode(enc).strip()
            if port_raw:
                break
        except UnicodeDecodeError:
            continue
    if port_raw is None:
        raise RuntimeError(f"Could not decode port file {port_file}")

    # Remove any embedded NULs just in case
    port_raw = port_raw.replace("\x00", "").strip()

    m = re.search(r"(\d{4,6})", port_raw)
    if not m:
        raise RuntimeError(f"Could not parse port from {port_file}: {repr(port_raw)}")

    port = int(m.group(1))
    if not (1024 <= port <= 65535):
        raise RuntimeError(f"Parsed port out of range: {port}")

    conn_str = f'Provider=MSOLAP;Data Source="localhost:{port}";Integrated Security=SSPI;'
    print("Connection:", repr(conn_str))
    return conn_str

def serialize(val):
    if isinstance(val, Decimal):
        return float(val)
    return val


def format_csv_value(val) -> str:
    """Format a value for CSV output.

    Args:
        val: Value to format (can be Decimal, float, int, str, or None)

    Returns:
        Formatted string for CSV output
    """
    if val is None:
        return ""

    if isinstance(val, Decimal):
        val = float(val)

    if isinstance(val, float):
        # Round to 6 decimal places for float precision
        rounded = round(val, 6)
        # Remove trailing zeros and unnecessary decimal point
        if rounded == int(rounded):
            return str(int(rounded))
        return str(rounded)

    return str(val)


def write_csv(test_dir: Path, rows: list[list]) -> None:
    """Write query results to expected.csv in the test directory.

    Args:
        test_dir: Path to the test directory
        rows: List of rows, each row is a list of values
    """
    csv_path = test_dir / "expected.csv"
    lines = []
    for row in rows:
        line = ",".join(format_csv_value(v) for v in row)
        lines.append(line)

    csv_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote to csv:", csv_path)



def extract_all(queries: dict[str, str], output_path: str) -> int:
    """Execute DAX queries and write results to CSV files.

    Args:
        queries: Dict mapping test_name to dax_expression
        output_path: Path for JSON output file

    Returns:
        Number of baseline files written
    """
    conn_str = get_pbi_connection_string()
    results = {}

    with Pyadomd(conn_str) as conn:
        for name, dax in queries.items():
            print(f"Processing: {name}")
            with conn.cursor().execute(dax) as cur:
                rows = cur.fetchall()
                cols = [c.name for c in cur.description]
                results[name] = {
                    "columns": cols,
                    "rows": [[serialize(v) for v in row] for row in rows]
                }

                # Write CSV to test directory
                test_dir = TEST_MODEL_DIR / name
                write_csv(test_dir, rows)

    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, cls=DateTimeEncoder)

    return len(results)

def main() -> None:
    """CLI entry point for extract_dax_baselines."""
    parser = argparse.ArgumentParser(
        description="Extract DAX baselines from Power BI Desktop"
    )
    parser.add_argument(
        "--test",
        type=str,
        help="Process only the specified test (by name)",
        metavar="TEST_NAME"
    )
    args = parser.parse_args()

    all_queries = discover_tests()

    if args.test:
        # Filter to single test
        if args.test not in all_queries:
            available = ", ".join(sorted(all_queries.keys()))
            print(f"Error: Test '{args.test}' not found")
            print(f"Available tests: {available}")
            return
        queries = {args.test: all_queries[args.test]}
    else:
        queries = all_queries

    print(f"Discovered {len(queries)} test(s) with pbi.dax files")
    for name in sorted(queries.keys()):
        print(f"  - {name}")

    count = extract_all(queries, "dax_baselines.json")
    print(f"Wrote {count} baseline files")


if __name__ == "__main__":
    main()
