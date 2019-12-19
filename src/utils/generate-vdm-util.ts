/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { flags } from '@oclif/command';
import { AlphabetLowercase, AlphabetUppercase } from '@oclif/parser/lib/alphabet';
import { IBooleanFlag, IOptionFlag } from '@oclif/parser/lib/flags';
import { GeneratorOptions as GeneratorOptionsSDK, generatorOptionsCli as generatorOptionsSDK } from '@sap/cloud-sdk-generator';
import * as path from 'path';
import { Options } from 'yargs';

interface GeneratorOptionCli {
  projectDir: Options;
}

export const generatorOptionCli: GeneratorOptionCli = {
  projectDir: {
    default: '.',
    describe: 'Path to the folder in which the VDM should be created. The input and output dir are relative to this directory.',
    type: 'string'
  }
};

type AllOptions = GeneratorOptionsSDK & GeneratorOptionCli;

// OClif distinguishes between boolean and string flags. Split the keys to get proper typing
type FilterBooleanKeys<Base> = {
  [Key in keyof Base]: Base[Key] extends boolean ? Key : never;
};

type BoolArgKeys = NonNullable<FilterBooleanKeys<AllOptions>[keyof AllOptions]>;
export type BoolArgType = {
  [optionName in BoolArgKeys]: IBooleanFlag<boolean>;
};

type StringArgKeys = keyof Omit<AllOptions, BoolArgKeys>;
export type StringArgType = {
  [optionName in StringArgKeys]: IOptionFlag<string | undefined>;
};

export type FlagsParsed = {
  [Key in keyof AllOptions]: AllOptions[Key] extends boolean ? boolean : string | undefined;
};

export function toGeneratorSDK(cliFlags: FlagsParsed): GeneratorOptionsSDK {
  return Object.entries(cliFlags)
    .filter(([key, value]) => typeof value !== 'undefined' && generatorOptionsSDK.hasOwnProperty(key))
    .reduce((prev, [key, value]) => ({ ...prev, [key]: value }), {}) as GeneratorOptionsSDK;
}

export function toBooleanFlag(yargsBool: Options): IBooleanFlag<boolean> {
  const extendedDescription = `${yargsBool.describe} [default: ${yargsBool.default}].`;
  return flags.boolean({
    char: yargsBool.alias as AlphabetLowercase | AlphabetUppercase,
    description: extendedDescription,
    required: yargsBool.requiresArg,
    default: yargsBool.default,
    allowNo: yargsBool.default
  });
}

export function toStringFlag(yargsString: Options): IOptionFlag<string | undefined> {
  const options: Partial<IOptionFlag<string>> = {
    char: yargsString.alias as AlphabetLowercase | AlphabetUppercase,
    description: yargsString.describe,
    required: yargsString.requiresArg,
    default: yargsString.default
  };

  if (yargsString?.coerce?.name === 'resolve') {
    options.parse = (input: string, context: any): string => {
      let projectDir = '.';
      if (context.argv.includes('--projectDir')) {
        projectDir = context.argv[context.argv.indexOf('--projectDir') + 1];
      }
      return path.resolve(projectDir, input);
    };
  }
  return flags.string(options);
}
