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
* [`sml-converters add-files-to-snowflake`](#sml-converters-add-files-to-snowflake)
* [`sml-converters bim-to-sml`](#sml-converters-bim-to-sml)
* [`sml-converters dbt-to-sml`](#sml-converters-dbt-to-sml)
* [`sml-converters help [COMMAND]`](#sml-converters-help-command)
* [`sml-converters sml-to-cortex`](#sml-converters-sml-to-cortex)

## `sml-converters add-files-to-snowflake`

Add converted Snowflake Cortex Analyst yaml to Snowflake

```
USAGE
  $ sml-converters add-files-to-snowflake --snowflakeAuthenticator <value> --snowflakeAccount <value> --snowflakeDatabase
    <value> --snowflakeSchema <value> [--source <value>] [--snowflakeStage <value>] [--snowflakeWarehouse <value>]
    [--snowflakeRole <value>]

FLAGS
  --snowflakeAccount=<value>        (required) Snowflake account identifier
  --snowflakeAuthenticator=<value>  (required) [default: SNOWFLAKE] Snowflake authenticator type
  --snowflakeDatabase=<value>       (required) Snowflake database name
  --snowflakeRole=<value>           Snowflake role to use for the connection
  --snowflakeSchema=<value>         (required) Snowflake schema name
  --snowflakeStage=<value>          Snowflake stage name for uploading files
  --snowflakeWarehouse=<value>      Snowflake warehouse name
  --source=<value>                  [default: ./] Source folder

DESCRIPTION
  Add converted Snowflake Cortex Analyst yaml to Snowflake

  Snowflake authentication can be found in .env.example. Types of snowflakeAuthenticator will have different
  requirements.
  Please read the README.md file to see how to use certain authentication methods.
  Or see https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate for what parameters must be
  set.

EXAMPLES
  $ sml-converters add-files-to-snowflake --snowflakeAuthenticator=SNOWFLAKE

  $ sml-converters add-files-to-snowflake --snowflakeAuthenticator=EXTERNALBROWSER

  $ sml-converters add-files-to-snowflake --snowflakeAuthenticator=SNOWFLAKE_JWT
```

## `sml-converters bim-to-sml`

Converts a Power BI Model to SML

```
USAGE
  $ sml-converters bim-to-sml [--source <value>] [--output <value>] [--clean] [--atscaleConnectionId <value>]

FLAGS
  --atscaleConnectionId=<value>  [default: con1] AtScale connection id. The connection id of the data warehouse in
                                 AtScale.
  --clean                        Clean the output folder contents without the .git folder
  --output=<value>               [default: ./bim_output] Output folder
  --source=<value>               [default: ./] Source folder

DESCRIPTION
  Converts a Power BI Model to SML



EXAMPLES
  $ sml-converters bim-to-sml

  $ sml-converters bim-to-sml --clean

  $ sml-converters bim-to-sml --source=./bim-source-path --output=./sml-output-path

  $ sml-converters bim-to-sml -s ./bim-source-path -o ./sml-output-path

  $ sml-converters bim-to-sml -s ./bim-source-path -o ./sml-output-path --clean

  $ sml-converters bim-to-sml -s ./bim-source-path -o ./sml-output-path --atscaleConnectionId=con1 --clean
```

## `sml-converters dbt-to-sml`

Converts DBT to SML

```
USAGE
  $ sml-converters dbt-to-sml [--source <value>] [--output <value>] [--dbType
    bigquery|snowflake|postgresql|databricks|iris] [--database <value>] [--schema <value>] [--atscaleConnectionId
    <value>] [--clean]

FLAGS
  --atscaleConnectionId=<value>  [default: con1] AtScale connection id. The connection id of the data warehouse in
                                 AtScale.
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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.32/src/commands/help.ts)_

## `sml-converters sml-to-cortex`

Convert from SML to Snowflake Cortex Analyst yaml

```
USAGE
  $ sml-converters sml-to-cortex [--source <value>] [--output <value>] [--clean]

FLAGS
  --clean           Clean the output folder contents without the .git folder
  --output=<value>  [default: ./cortex_output/] Directory in which to write cortex yaml output file(s)
  --source=<value>  [default: ./] Source folder

DESCRIPTION
  Convert from SML to Snowflake Cortex Analyst yaml

EXAMPLES
  $ sml-converters sml-to-cortex 

  $ sml-converters sml-to-cortex --clean

  $ sml-converters sml-to-cortex --source=./sml-source-path --output=./cortex-output-path

  $ sml-converters sml-to-cortex -s ./sml-source-path -o ./cortex-output-path

  $ sml-converters sml-to-cortex -s ./sml-source-path -o ./cortex-output-path --clean
```
<!-- commandsstop -->

# License

This project is licensed under the [Apache License 2.0](LICENSE). See the LICENSE file for full details.
