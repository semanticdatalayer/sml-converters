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
  - [`sml-converters add-files-to-snowflake`](#sml-converters-add-files-to-snowflake)
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
  $ sml-converters sml-to-cortex [--source <value>] [--output <value>] [--clean]

FLAGS
  --clean                        Clean the output folder contents without the .git folder
  --output=<value>               [default: ./cortex_output/] Output folder
  --source=<value>               [default: ./] Source folder

DESCRIPTION
  Converts SML to Snowflake Cortex


EXAMPLES
  $ sml-converters sml-to-cortex

  $ sml-converters sml-to-cortex --clean

  $ sml-converters sml-to-cortex -source ./sml-source-path -output ./cortex-output-path

  $ sml-converters sml-to-cortex -s ./sml-source-path -o ./cortex-output-path

  $ sml-converters sml-to-cortex -s ./sml-source-path -o ./dbt-output-path --clean

```

## `sml-converters add-files-to-snowflake`

Add converted Snowflake Cortex Analyst yaml to Snowflake

```
USAGE
  $ sml-converters add-files-to-snowflake --snowflakeAuthenticator
    OAUTH|SNOWFLAKE|EXTERNALBROWSER|SNOWFLAKE_JWT|USERNAME_PASSWORD_MFA|PROGRAMMATIC_ACCESS_TOKEN|
    *.okta.com|OAUTH_AUTHORIZATION_CODE|OAUTH_CLIENT_CREDENTIALS --snowflakeAccount <value> 
    --snowflakeDatabase <value> --snowflakeSchema <value> [--source <value>] [--snowflakeStage <value>]
    [--snowflakeWarehouse <value>] [--snowflakeRole <value>]

FLAGS
  --snowflakeAccount=<value>         (required) Snowflake account identifier
  --snowflakeAuthenticator=<option>  (required) [default: SNOWFLAKE] Snowflake authenticator type
                                     <options: SNOWFLAKE|EXTERNALBROWSER|SNOWFLAKE_JWT|USERNAME_PASSWORD_MFA|PROGRAMMATIC_ACCESS_TOKEN|*.okta.com|OAUTH|>
  --snowflakeDatabase=<value>        (required) Snowflake database name
  --snowflakeRole=<value>            Snowflake role to use for the connection
  --snowflakeSchema=<value>          (required) Snowflake schema name
  --snowflakeStage=<value>           Snowflake stage name for uploading files
  --snowflakeWarehouse=<value>       Snowflake warehouse name
  --source=<value>                   [default: ./] Source folder

DESCRIPTION
  Snowflake authentication example can be found in .env.example. Types of SNOWFLAKE_AUTH will have different requirements.

EXAMPLES
  $ sml-converters add-files-to-snowflake --snowflakeAuthenticator=SNOWFLAKE

  $ sml-converters add-files-to-snowflake --snowflakeAuthenticator=EXTERNALBROWSER

  $ sml-converters add-files-to-snowflake --snowflakeAuthenticator=SNOWFLAKE_JWT
```

### REQUIRED ENV VARIABLES FOR AUTH TYPE
| Authenticator | Required Environment Variables |
|---------------|-------------------------------|
| `SNOWFLAKE` | `SNOWFLAKE_USERNAME`, `SNOWFLAKE_PASSWORD` |
| `EXTERNALBROWSER` | *(none - uses browser)* |
| `SNOWFLAKE_JWT` | `SNOWFLAKE_PRIVATE_KEY_PATH`, `SNOWFLAKE_PRIVATE_KEY_PASS`(Only if rs8 file is encrypted) |
| `USERNAME_PASSWORD_MFA` | `SNOWFLAKE_USERNAME`, `SNOWFLAKE_PASSWORD`, `SNOWFLAKE_PASSCODE` |
| `*.okta.com` | `SNOWFLAKE_USERNAME`, `SNOWFLAKE_PASSWORD` |
| `OAUTH` | `SNOWFLAKE_TOKEN` |
| `PROGRAMMATIC_ACCESS_TOKEN` | `SNOWFLAKE_USERNAME`, `SNOWFLAKE_PASSWORD` |

### Not yet supported
`OAUTH_AUTHORIZATION_CODE` `OAUTH_CLIENT_CREDENTIALS`

For more help go to  [https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate](https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate) for what parameters must be set

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
