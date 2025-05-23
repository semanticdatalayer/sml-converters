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
* [`sml-converters dbt-to-sml`](#sml-converters-dbt-to-sml)
* [`sml-converters help [COMMAND]`](#sml-converters-help-command)

## `sml-converters dbt-to-sml`

Converts DBT to SML

```
USAGE
  $ sml-converters dbt-to-sml [--source <value>] [--output <value>]

FLAGS
  --output=<value>  [default: ./sml_output] Output folder
  --source=<value>  [default: ./] Source folder

DESCRIPTION
  Converts DBT to SML




EXAMPLES
  $ sml-converters dbt-to-sml

  $ sml-converters dbt-to-sml -source ./dbt-source-path -output ./sml-output-path

  $ sml-converters dbt-to-sml -s ./dbt-source-path -o ./sml-output-path
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
