<a href="https://sap.com/s4sdk"><img src="https://help.sap.com/doc/6c02295dfa8f47cf9c08a19f2e172901/1.0/en-US/logo-with-js.svg" alt="SAP Cloud SDK for JavaScript Logo" height="122.92" width="226.773"/></a>

# SAP Cloud SDK CLI

A nifty CLI for the SAP Cloud SDK for JavaScript to initialize and package your SAP Cloud Platform application.
It is also the launchpad when trying to set up the approuter or getting started with the [SAP Cloud SDK for Continuous Delivery](https://github.com/SAP/cloud-s4-sdk-pipeline).

## About the SDK

The SAP Cloud SDK supports you end-to-end when developing applications that communicate with SAP solutions and services such as SAP S/4HANA Cloud, SAP SuccessFactors, and many others.

Using the SDK, you can reduce your effort when developing an application on SAP Cloud Platform by building on best practices delivered by the SDK. 
The SDK provides Java libraries, JavaScript libraries, project templates and a continuous delivery toolkit.

## Usage

<!-- usage -->
```sh-session
$ npm install -g @sap-cloud-sdk/cli
$ sap-cloud-sdk COMMAND
running command...
$ sap-cloud-sdk (-v|--version|version)
@sap-cloud-sdk/cli/0.0.4 darwin-x64 node-v11.12.0
$ sap-cloud-sdk --help [COMMAND]
USAGE
  $ sap-cloud-sdk COMMAND
...
```
<!-- usagestop -->

## Commands

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

_See code: [src/commands/add-approuter.ts](https://github.com/SAP/cloud-sdk-cli/blob/v0.0.4/src/commands/add-approuter.ts)_

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

_See code: [src/commands/add-cx-server.ts](https://github.com/SAP/cloud-sdk-cli/blob/v0.0.4/src/commands/add-cx-server.ts)_

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

_See code: [src/commands/help-page.ts](https://github.com/SAP/cloud-sdk-cli/blob/v0.0.4/src/commands/help-page.ts)_

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

_See code: [src/commands/init.ts](https://github.com/SAP/cloud-sdk-cli/blob/v0.0.4/src/commands/init.ts)_

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

_See code: [src/commands/package.ts](https://github.com/SAP/cloud-sdk-cli/blob/v0.0.4/src/commands/package.ts)_
<!-- commandsstop -->

## Contribute

The CLI is based on [oclif](https://oclif.io/docs/introduction.html) and can be extended using [plugins](https://oclif.io/docs/plugins). 
If you think your plugin should be part of the CLI itself, feel free to [open a pull request](https://github.com/SAP/cloud-sdk-cli/compare). 
If you have found a bug in our existing functionality, please [open an issue](https://github.com/SAP/cloud-sdk-cli/issues/new).

## License

Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
This file is licensed under the Apache Software License, v. 2 except as noted otherwise in the [LICENSE file](LICENSE).

Note: This license does not apply to the SAP Cloud SDK for JavaScript Logo referenced in this README.
