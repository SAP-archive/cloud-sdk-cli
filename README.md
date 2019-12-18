<a href="https://sap.com/s4sdk"><img src="https://help.sap.com/doc/6c02295dfa8f47cf9c08a19f2e172901/1.0/en-US/logo-with-js.svg" alt="SAP Cloud SDK for JavaScript Logo" height="122.92" width="226.773"/></a>

# SAP Cloud SDK CLI

[![Tests Badge](https://github.com/SAP/cloud-sdk-cli/workflows/Tests/badge.svg?branch=master)](https://github.com/SAP/cloud-sdk-cli/actions)
[![NPM Downloads](https://img.shields.io/npm/dw/@sap-cloud-sdk/cli)](https://www.npmjs.com/package/@sap-cloud-sdk/cli)

A nifty command line interface (CLI) for the SAP Cloud SDK for JavaScript to initialize and package your SAP Cloud Platform application.
It is also the launchpad when trying to set up the approuter or getting started with the [SAP Cloud SDK for Continuous Delivery](https://github.com/SAP/cloud-s4-sdk-pipeline).

## About the SDK

The SAP Cloud SDK supports you end-to-end when developing applications that communicate with SAP solutions and services such as SAP S/4HANA Cloud, SAP SuccessFactors, and many others.

Using the SDK, you can reduce your effort when developing an application on SAP Cloud Platform by building on best practices delivered by the SDK.
The SDK provides Java libraries, JavaScript libraries, project templates and a continuous delivery toolkit.

## Installation
To install the CLI globally, run:

```sh-session
$ npm install -g @sap-cloud-sdk/cli
```

### Update
As long as the CLI version is less than `1.0.0`, run the following to update to the latest version. Please keep in mind, that these updates can have breaking changes as per the [semver spec](https://semver.org/#spec-item-4).

```sh-session
$ npm install -g @sap-cloud-sdk/cli@latest
```

## Usage

<!-- usage -->
```sh-session
$ npm install -g @sap-cloud-sdk/cli
$ sap-cloud-sdk COMMAND
running command...
$ sap-cloud-sdk (-v|--version|version)
@sap-cloud-sdk/cli/0.0.10 darwin-x64 node-v11.12.0
$ sap-cloud-sdk --help [COMMAND]
USAGE
  $ sap-cloud-sdk COMMAND
...
```
<!-- usagestop -->

The CLI can initialize an nest-based project or (the more common case) add everything you need to develop for SAP Cloud Platform to an existing project no matter what backend framework you use.
If there are any incompatibilities, please let us know in the [issues](https://github.com/SAP/cloud-sdk-cli/issues/new/choose)!

To get started run
``` sh-session
$ sap-cloud-sdk init
```
in the project folder.

It will guide you through the initialization, create the necessary files and add necessary dependencies.
If you run it in an empty folder, it will ask if you want to initialize a project using [@nest/cli](https://github.com/nestjs/nest-cli).

To deploy to and run on Cloud Foundry, you need to
1. Make sure that your app listens to port 8080
2. Build your app if necessary
3. Run [`sap-cloud-sdk package`](#sap-cloud-sdk-package)
4. Push to Cloud Foundry (`cf push`)

For productive use, your app should implement user authentication and authorization.
For SAP Cloud Foundry, this is usually done by using the approuter and xsuaa service.
Start by running [`sap-cloud-sdk add-approuter`](#sap-cloud-sdk-add-approuter) and configure the xsuaa service accordingly.

## Commands

<!-- commands -->
* [`sap-cloud-sdk add-approuter`](#sap-cloud-sdk-add-approuter)
* [`sap-cloud-sdk add-cx-server`](#sap-cloud-sdk-add-cx-server)
* [`sap-cloud-sdk autocomplete [SHELL]`](#sap-cloud-sdk-autocomplete-shell)
* [`sap-cloud-sdk help [COMMAND]`](#sap-cloud-sdk-help-command)
* [`sap-cloud-sdk help-page`](#sap-cloud-sdk-help-page)
* [`sap-cloud-sdk init [PROJECTDIR]`](#sap-cloud-sdk-init-projectdir)
* [`sap-cloud-sdk generate-vdm [OPTIONS]`](#sap-cloud-sdk-generate-vdm)
* [`sap-cloud-sdk package`](#sap-cloud-sdk-package)

## `sap-cloud-sdk add-approuter`

Setup your Cloud Foundry app to authenticate through the app router

```
USAGE
  $ sap-cloud-sdk add-approuter

OPTIONS
  -h, --help  show CLI help
  --force     Do not fail if a file already exist and overwrite it.

ALIASES
  $ sap-cloud-sdk add-app-router

EXAMPLE
  $ sap-cloud-sdk add-approuter
```

_See code: [src/commands/add-approuter.ts](https://github.com/SAP/cloud-sdk-cli/blob/v0.0.10/src/commands/add-approuter.ts)_

## `sap-cloud-sdk add-cx-server`

Add the scripts to set up a Jenkins master for CI/CD of your project

```
USAGE
  $ sap-cloud-sdk add-cx-server

OPTIONS
  -h, --help  show CLI help
  --force     Do not fail if a file already exist and overwrite it.

EXAMPLE
  $ sap-cloud-sdk add-cx-server
```

_See code: [src/commands/add-cx-server.ts](https://github.com/SAP/cloud-sdk-cli/blob/v0.0.10/src/commands/add-cx-server.ts)_

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

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.1.5/src/commands/autocomplete/index.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.2/src/commands/help.ts)_

## `sap-cloud-sdk help-page`

Open the product page, which contains tutorials and links to all relevant resources

```
USAGE
  $ sap-cloud-sdk help-page

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/help-page.ts](https://github.com/SAP/cloud-sdk-cli/blob/v0.0.10/src/commands/help-page.ts)_

## `sap-cloud-sdk init [PROJECTDIR]`

Initializes your project for the SAP Cloud SDK, SAP Cloud Platform Cloud Foundry and CI/CD using the SAP Cloud SDK toolkit

```
USAGE
  $ sap-cloud-sdk init [PROJECTDIR]

ARGUMENTS
  PROJECTDIR  Path to the folder in which the project should be created.

OPTIONS
  -h, --help               Show help for the new command.
  -v, --verbose            Show more detailed output.
  --force                  Do not fail if a file or npm script already exist and overwrite it.
  --frontendScripts        Add frontend-related npm scripts which are executed by our CI/CD toolkit.
  --projectDir=projectDir  Path to the folder in which the project should be created.

EXAMPLES
  $ sap-cloud-sdk init
  $ sap-cloud-sdk init --help
```

_See code: [src/commands/init.ts](https://github.com/SAP/cloud-sdk-cli/blob/v0.0.10/src/commands/init.ts)_


## `sap-cloud-sdk generate-vdm [OPTIONS]`

Generates an typescript OData client from .edmx/.xml service definition files.
Uses sap-cloud-sdk generator under the hood. 

```
USAGE
  $ sap-cloud-sdk generate-vdm

OPTIONS
  -i, --inputDir=inputDir                              (required) This directory will be recursively searched for .edmx/.xml files.
  -o, --outputDir=outputDir                            (required) Directory to save the generated code in.
  -s, --serviceMapping=serviceMapping                  Configuration file to ensure consistent names between multiple generation runs with updated / changed metadata files. Will be generated if not existent. By default it will be saved to/read from the input directory as "service-mapping.json".
  --aggregatorDirectoryName=aggregatorDirectoryName    Hack for cloud-sdk-vdm package
  --aggregatorNpmPackageName=aggregatorNpmPackageName  When provided, the generator will generate an additional package with the provided name that has dependencies to all other generated packages.
  --changelogFile=changelogFile                        Path to file that will be copied into the generated packages under the filename CHANGELOG.md.
  --clearOutputDir                                     When set to true, the generator will delete EVERYTHING in the specified output directory before generating code. [default: false].
  --forceOverwrite                                     By default, the generator will exit when encountering a file that already exists. When set to true, it will be overwritten instead. Please note that compared to the --clearOutputDir option, this will not delete outdated files. [default: false].
  --generateCSN                                        When set to true a CSN file will be generated for each service definition in the output directory. [default: false].
  --[no-]generateJs                                    By default, the generator will also generate transpiled .js, .js.map, .d.ts and .d.ts.map files. When set to false, the generator will only generate .ts files. [default: true].
  --[no-]generateNpmrc                                 By default, the generator will generate a .npmrc file specifying a registry for @sap scoped dependencies. When set to false, the generator will skip the generation of .npmrc. [default: true].
  --[no-]generatePackageJson                           By default, the generator will generate a package.json file, specifying dependencies and scripts for compiling and generating documentation. When set to false, the generator will skip the generation of the package.json. [default: true].
  --[no-]generateTypedocJson                           By default, the generator will generate a typedoc.json file for each package, used for the corresponding "doc" npm script. When set to false, the generator will skip the generation of the typedoc.json. [default: true].
  --projectDir=projectDir                              [default: .] Path to the folder in which the VDM should be created. The input and output dir are relative to this directory.
  --s4hanaCloud                                        When set to true, the description of the generated packages will be specific to S/4HANA Cloud. [default: false].
  --sdkAfterVersionScript                              When set to true, the package.json of generated services will have the after-version script to internally keep the versions in sync. [default: false].
  --useSwagger                                         Augment parsed information with information from swagger definition files. Files are expected to have the same name as the edmx file, but with .json as suffix. [default: false].
  --writeReadme                                        When set to true, the generator will write a README.md file into the root folder of every package. This option does not make that much sense without also set useSwagger to "true". [default: false].

EXAMPLES
  $ sap-cloud-sdk generate-vdm -i directoryWithEdmxFiles -o outputDirectory --forceOverwrite
  $ sap-cloud-sdk generate-vdm --help

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

  -v, --verbose          Show more detailed output.

  --skipInstall          Skip `npm i --production` during packaging

EXAMPLES
  $ sap-cloud-sdk package
  $ sap-cloud-sdk package -i="index.html"
  $ sap-cloud-sdk package --include="package.json,package-lock.json,index.js,dist/**/*" --exclude="**/*.java"
```

_See code: [src/commands/package.ts](https://github.com/SAP/cloud-sdk-cli/blob/v0.0.10/src/commands/package.ts)_
<!-- commandsstop -->

## Contribute

The CLI is based on [oclif](https://oclif.io/docs/introduction.html) and can be extended using [plugins](https://oclif.io/docs/plugins).
If you think your plugin should be part of the CLI itself, feel free to [open a pull request](https://github.com/SAP/cloud-sdk-cli/compare).
If you have found a bug in our existing functionality, please [open an issue](https://github.com/SAP/cloud-sdk-cli/issues/new/choose).

### Release

The easiest way to create a new release is running

``` sh-session
$ npx np
```

This will test the code, run any prepublish steps, increase the version as selected by the user and create a draft release in github.
Afterwards fill in the release notes and press "Publish release".
This will trigger the github action and a new release will be published on npm automatically.

## License

Copyright (c) 2019 SAP SE or an SAP affiliate company.
All rights reserved.
This file is licensed under the Apache Software License, v. 2 except as noted otherwise in the [LICENSE file](LICENSE).

Note: This license does not apply to the SAP Cloud SDK for JavaScript Logo referenced in this README.
