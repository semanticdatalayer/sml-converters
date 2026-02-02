# Run DAX Queries Against Power BI Desktop

Instructions for running DAX queries programmatically against a PBIX file using Python. This is what was required for my setup (I have a M2 mac) but it could be different for other machines.

## Prerequisites (Windows)

- Power BI Desktop **running** with the target PBIX open
  - If the pbix was not created in Power BI but is instead pre-existing or a hand-edited bim file, see "Loading Hand-Edited BIM Files into Power BI" below
- Python **3.11 x64** (important: not ARM, not 3.12)
- Power BI Desktop + Tabular Editor installed

## 1. Set Up Python Environment

```powershell
py -3.11-64 -m venv .venv
.\.venv\Scripts\activate
pip install pythonnet pyadomd
```

## 2. Install ADOMD.NET

Required for pyadomd. Use NuGet (recommended):

```powershell
winget install NuGet.NuGet
mkdir C:\adomd
cd C:\adomd
nuget install Microsoft.AnalysisServices.AdomdClient.retail.amd64
```

Locate the DLL at:

```
C:\adomd\Microsoft.AnalysisServices.AdomdClient.retail.amd64.<version>\lib\net45\Microsoft.AnalysisServices.AdomdClient.dll
```

## 3. Load ADOMD.NET in Python

**This must run before importing pyadomd:**

```python
import clr
clr.AddReference(
    r"C:\adomd\Microsoft.AnalysisServices.AdomdClient.retail.amd64.<version>\lib\net45\Microsoft.AnalysisServices.AdomdClient.dll"
)
from pyadomd import Pyadomd
```

Alternative path if installed via MSI:

```
C:\Program Files\Microsoft.NET\ADOMD.NET\160\Microsoft.AnalysisServices.AdomdClient.dll
```

## 4. Discover Power BI Desktop Port

Power BI writes the port to a file **encoded as UTF-16**:

```python
import os, glob, re

def get_pbi_connection_string():
    user = os.environ["USERPROFILE"]
    pattern = (
        rf"{user}\AppData\Local\Microsoft\Power BI Desktop"
        r"\AnalysisServicesWorkspaces\*\Data\msmdsrv.port.txt"
    )

    files = glob.glob(pattern)
    if not files:
        raise RuntimeError("Power BI Desktop not running")

    port_file = max(files, key=os.path.getmtime)

    with open(port_file, "rb") as f:
        b = f.read()

    # Decode UTF-16 and strip NULs
    port_raw = b.decode("utf-16").replace("\x00", "").strip()

    m = re.search(r"\b(\d{4,6})\b", port_raw)
    if not m:
        raise RuntimeError(f"Invalid port contents: {repr(port_raw)}")

    port = int(m.group(1))
    return f'Provider=MSOLAP;Data Source="localhost:{port}";Integrated Security=SSPI;'
```

## 5. Run a DAX Query (Smoke Test)

```python
conn_str = get_pbi_connection_string()

with Pyadomd(conn_str) as conn:
    cur = conn.cursor()
    cur.execute('EVALUATE ROW("ok", 1)')
    print(cur.fetchall())
```

If this works, **you are fully connected to the PBIX model**.

## 6. Capture Baselines for Test Suite

### Manual Approach

Execute arbitrary EVALUATE DAX queries and fetch results. Normalize ordering + types, then store as baseline for comparison against AtScale MDX results.

```python
cur.execute("EVALUATE <DAX QUERY>")
rows = cur.fetchall()
cols = [c.name for c in cur.description]
```

### Using the Extraction Script

The script `scripts/extract_dax_baselines.py` reads DAX queries from the pbi-smoke test suite and writes results to `expected.csv` for each test. Update `TEST_MODEL_DIR` and `reference` at the top of the script, then run:

```bash
python .\extract_dax_baselines.py
```

**Note:** You may need to copy the test suite to the file system in the Windows vm, run it there, then copy the results back.

## Loading Hand-Edited BIM Files into Power BI

If a BIM file has been hand-edited, it can't be opened directly in Power BI Desktop. Use Tabular Editor to transfer the model:

### 1. Create a new PBIX with data connection

1. Open Power BI Desktop
2. Connect to your database (e.g., Snowflake connector)
3. Import all tables needed for your BIM model (e.g., TPCDS tables)
4. Save the PBIX

### 2. Get the Power BI port

```powershell
Get-Content "$env:LOCALAPPDATA\Microsoft\Power BI Desktop\AnalysisServicesWorkspaces\*\Data\msmdsrv.port.txt"
```

Alternatively, use the Python function in section 4 above.

### 3. Open two instances of Tabular Editor

Install Tabular Editor (I used 2.27.2, free version).

**Instance 1:** Open your hand-edited BIM file

- File > Open > From File > `your-model.bim`

**Instance 2:** Connect to Power BI Desktop

- Model > Deploy
- Server: `localhost:<port>` (from step 2)
- Database: `<choose a name>`

### 4. Copy objects from BIM to Power BI

In the BIM instance, copy objects (Ctrl+C). In the Power BI instance, click the target folder and paste (Ctrl+V).

**Copy in this order:**

1. Hierarchies (within each table)
2. Measures (within each table, can copy folder if needed)
3. Relationships
4. Roles (optional)

### 5. Save

Save in Tabular Editor, then return to Power BI Desktop. The objects should now exist and can be saved to the PBIX.

## Key Gotchas

| Issue                                     | Problem                                        |
| ----------------------------------------- | ---------------------------------------------- |
| Python 3.12 / ARM builds                  | Breaks pythonnet                               |
| Assembly name lookup                      | Must use `AddReference(path)` with full path   |
| Sorting workspace files lexicographically | Use `max(files, key=os.path.getmtime)` instead |
| Assuming port file is ASCII               | It's UTF-16 with NULs                          |
| Regex extracting only first digit         | Use `\b(\d{4,6})\b` pattern                    |

## Result

You now have:

- A repeatable way to run DAX directly against a PBIX
- A stable connection to Power BI Desktop's in-memory model
- Everything needed to build a **DAX ↔ AtScale MDX equivalence test suite**
