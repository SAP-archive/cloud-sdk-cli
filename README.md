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
sap-cloud-sdk-cli/0.0.1 darwin-x64 node-v11.12.0
$ sap-cloud-sdk --help [COMMAND]
USAGE
  $ sap-cloud-sdk COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`sap-cloud-sdk add-approuter`](#sap-cloud-sdk-add-approuter)
* [`sap-cloud-sdk add-cx-server`](#sap-cloud-sdk-add-cx-server)
* [`sap-cloud-sdk autocomplete [SHELL]`](#sap-cloud-sdk-autocomplete-shell)
* [`sap-cloud-sdk help [COMMAND]`](#sap-cloud-sdk-help-command)
* [`sap-cloud-sdk help-page`](#sap-cloud-sdk-help-page)
* [`sap-cloud-sdk init`](#sap-cloud-sdk-init)
* [`sap-cloud-sdk package`](#sap-cloud-sdk-package)

## `sap-cloud-sdk add-approuter`

Setup your Cloud Foundry app to authenticate through the app router

```
USAGE
  $ sap-cloud-sdk add-approuter

OPTIONS
  -h, --help  show CLI help

ALIASES
  $ sap-cloud-sdk add-app-router

EXAMPLE
  $ sap-cloud-sdk add-approuter
```

## `sap-cloud-sdk add-cx-server`

Add the scripts to set up a Jenkins master for CI/CD of your project

```
USAGE
  $ sap-cloud-sdk add-cx-server

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ sap-cloud-sdk add-cx-server
```

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

## `sap-cloud-sdk help-page`

Open the product page, which contains tutorials and links to all relevant resources

```
USAGE
  $ sap-cloud-sdk help-page

OPTIONS
  -h, --help  show CLI help
```

## `sap-cloud-sdk init`

Initializes your project for the SAP Cloud SDK, SAP Cloud Platform Cloud Foundry and CI/CD using the SAP Cloud SDK toolkit

```
USAGE
  $ sap-cloud-sdk init

OPTIONS
  -h, --help               Show help for the new command.
  --projectDir=projectDir  [default: .] Path to the folder in which the project should be created.

EXAMPLES
  $ sap-cloud-sdk init
  $ sap-cloud-sdk init --help
```

## `sap-cloud-sdk package`

Copies the specified files to the deployment folder

```
USAGE
  $ sap-cloud-sdk package

OPTIONS
  -e, --exclude=exclude  Comma seperated list of files or globs to exclude
  -h, --help             show CLI help

  -i, --include=include  [default: package.json,package-lock.json,index.js,dist/**/*] Comma seperated list of files or
                         globs to include

  -o, --output=output    [default: deployment] Output and deployment folder

  --skipInstall          Skip `npm i --production` during packaging

EXAMPLES
  $ sap-cloud-sdk package
  $ sap-cloud-sdk package -i="index.html"
  $ sap-cloud-sdk package --include="package.json,package-lock.json,index.js,dist/**/*" --exclude="**/*.java"
```
<!-- commandsstop -->
