/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command } from '@oclif/command';
import { IBooleanFlag, IOptionFlag } from '@oclif/parser/lib/flags';
import { generate, GeneratorOptions as GeneratorOptionsSDK, generatorOptionsCli as generatorOptionsSDK } from '@sap/cloud-sdk-generator';
import { Options } from 'yargs';
import { toBoolean, toGeneratorSDK, toOptionFlag } from '../utils/generate-vdm-util';

export interface GeneratorOptionCLI {
  projectDir: Options;
}

export const generatorOptionCLI: GeneratorOptionCLI = {
  projectDir: {
    default: '.',
    describe: 'Path to the folder in which the VDM should be created. The input and output dir are relative to this directory.',
    type: 'string'
  }
};

type AllOptions = GeneratorOptionsSDK & GeneratorOptionCLI;
export type AllKeys = keyof AllOptions;

// OClif distinguishes between boolean and string flags. Split the keys to get proper typing
type FilterBooleanKeys<Base> = {
  [Key in keyof Base]: Base[Key] extends boolean ? Key : never;
};

type BoolArgKeys = NonNullable<FilterBooleanKeys<AllOptions>[keyof AllOptions]>;
type BoolArgType = {
  [optionName in BoolArgKeys]: IBooleanFlag<boolean>;
};

type StringArgKeys = keyof Omit<AllOptions, BoolArgKeys>;
type StringArgType = {
  [optionName in StringArgKeys]: IOptionFlag<string | undefined>;
};
// These keys should be the same as AllKeys. We use this to check that no key got lost in the splitting of bool and string
export type AllKeysTest = BoolArgKeys | StringArgKeys;

type Flags = BoolArgType & StringArgType;
export type FlagsParsed = {
  [Key in AllKeys]: AllOptions[Key] extends boolean ? boolean : string | undefined;
};

export default class GenerateVdm extends Command {
  static description =
    'Generates a virtual data model (VDM) from a edmx service file definition. For SAP solution you can find these definitions on https://api.sap.com/';

  static examples = ['$ sap-cloud-sdk generate-vdm', '$ sap-cloud-sdk generate-vdm --help'];

  static flags: Flags = {
    // Options which are 1:1 to the SDK CLI
    inputDir: toOptionFlag(generatorOptionsSDK.inputDir),
    outputDir: toOptionFlag(generatorOptionsSDK.outputDir),
    generateCSN: toBoolean(generatorOptionsSDK.generateCSN),
    generateJs: toBoolean(generatorOptionsSDK.generateJs),
    generatePackageJson: toBoolean(generatorOptionsSDK.generatePackageJson),
    generateTypedocJson: toBoolean(generatorOptionsSDK.generateTypedocJson),
    generateNpmrc: toBoolean(generatorOptionsSDK.generateNpmrc),
    useSwagger: toBoolean(generatorOptionsSDK.useSwagger),
    serviceMapping: toOptionFlag(generatorOptionsSDK.serviceMapping),
    writeReadme: toBoolean(generatorOptionsSDK.writeReadme),
    changelogFile: toOptionFlag(generatorOptionsSDK.changelogFile),
    clearOutputDir: toBoolean(generatorOptionsSDK.clearOutputDir),
    aggregatorDirectoryName: toOptionFlag(generatorOptionsSDK.aggregatorDirectoryName),
    aggregatorNpmPackageName: toOptionFlag(generatorOptionsSDK.aggregatorNpmPackageName),
    sdkAfterVersionScript: toBoolean(generatorOptionsSDK.sdkAfterVersionScript),
    s4hanaCloud: toBoolean(generatorOptionsSDK.s4hanaCloud),
    forceOverwrite: toBoolean(generatorOptionsSDK.forceOverwrite),
    // Options related to the CLI some of them are mapped to SDK CLI attributes
    projectDir: toOptionFlag(generatorOptionCLI.projectDir)
  };

  async run() {
    const { flags } = this.parse(GenerateVdm);

    await generate(toGeneratorSDK(flags));
  }
}
