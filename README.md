SAP Cloud SDK CLI
===

A nifty CLI for the SAP Cloud SDK for JavaScript

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g sap-cloud-sdk-cli
$ sap-cloud-sdk COMMAND
running command...
$ sap-cloud-sdk (-v|--version|version)
sap-cloud-sdk-cli/1.0.0 darwin-x64 node-v11.12.0
$ sap-cloud-sdk --help [COMMAND]
USAGE
  $ sap-cloud-sdk COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`sap-cloud-sdk autocomplete [SHELL]`](#sap-cloud-sdk-autocomplete-shell)
* [`sap-cloud-sdk help [COMMAND]`](#sap-cloud-sdk-help-command)

## `sap-cloud-sdk autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ sap-cloud-sdk autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ sap-cloud-sdk autocomplete
  $ sap-cloud-sdk autocomplete bash
  $ sap-cloud-sdk autocomplete zsh
  $ sap-cloud-sdk autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.1.3/src/commands/autocomplete/index.ts)_

## `sap-cloud-sdk help [COMMAND]`

display help for sap-cloud-sdk

```
USAGE
  $ sap-cloud-sdk help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_
<!-- commandsstop -->
