# sml-converters

Semantic Modeling Language converters

[![Version](https://img.shields.io/npm/v/sml-converters.svg)](https://npmjs.org/package/sml-converters)
[![Downloads/week](https://img.shields.io/npm/dw/sml-converters.svg)](https://npmjs.org/package/sml-converters)

<!-- toc -->
* [sml-converters](#sml-converters)
* [Usage](#usage)
* [Commands](#commands)
* [License](#license)
<!-- tocstop -->

# Usage

```sh-session
$ npm install -g sml-converters
$ sml-converters COMMAND

running command...
$ sml-converters --version
0.0.0

$ sml-converters --help [COMMAND]
USAGE
  $ sml-converters COMMAND
...
```

# Commands

<!-- commands -->
- [sml-converters](#sml-converters)
- [Usage](#usage)
- [Commands](#commands)
  - [`sml-converters dbt-to-sml`](#sml-converters-dbt-to-sml)
  - [`sml-converters sml-to-cortex`](#sml-converters-sml-to-cortex)
  - [`sml-converters help [COMMAND]`](#sml-converters-help-command)
- [License](#license)

## `sml-converters dbt-to-sml`

Converts DBT to SML

```
USAGE
  $ sml-converters dbt-to-sml [--source <value>] [--output <value>] [--dbType
    bigquery|snowflake|postgresql|databricks|iris] [--database <value>] [--schema <value>] [--atscaleConnectionId
    <value>] [--clean]

FLAGS
  --atscaleConnectionId=<value>  [default: con1] AtScale connection id. The connection id of the data warehouse in AtScale.
  --clean                        Clean the output folder contents without the .git folder
  --database=<value>             [default: sample-db] Database name
  --dbType=<option>              [default: snowflake] Data Warehouse type
                                 <options: bigquery|snowflake|postgresql|databricks|iris>
  --output=<value>               [default: ./sml_output] Output folder
  --schema=<value>               [default: sample-schema] Schema name
  --source=<value>               [default: ./] Source folder

DESCRIPTION
  Converts DBT to SML




EXAMPLES
  $ sml-converters dbt-to-sml

  $ sml-converters dbt-to-sml --clean

  $ sml-converters dbt-to-sml -source ./dbt-source-path -output ./sml-output-path

  $ sml-converters dbt-to-sml -s ./dbt-source-path -o ./sml-output-path

  $ sml-converters dbt-to-sml -s ./dbt-source-path -o ./sml-output-path --clean
```
## `sml-converters sml-to-cortex`

Converts SML to Snowflake Cortex

```
USAGE
  $ sml-converters sml-to-cortex [SOURCE] [--output <value>]

ARGUMENTS
  SOURCE                         Root directory of SML files

FLAGS
  --output-path=<value>               [default: ./cortexOutput] Output folder

DESCRIPTION
  Converts SML to Snowflake Cortex


EXAMPLES
  $ sml-converters sml-to-cortex ./

  $ sml-converters sml-to-cortex ./ --output-path="./CortexOutput"

```

## `sml-converters help [COMMAND]`

Display help for sml-converters.

```
USAGE
  $ sml-converters help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for sml-converters.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.28/src/commands/help.ts)_
<!-- commandsstop -->

# License

This project is licensed under the [Apache License 2.0](LICENSE). See the LICENSE file for full details.
