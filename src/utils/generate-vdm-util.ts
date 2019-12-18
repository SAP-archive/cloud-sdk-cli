/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { flags } from '@oclif/command';
import { AlphabetLowercase, AlphabetUppercase } from '@oclif/parser/lib/alphabet';
import { IBooleanFlag, IOptionFlag } from '@oclif/parser/lib/flags';
import { generatorOptionsCli as generatorOptionsSDK, GeneratorOptions } from '@sap/cloud-sdk-generator';
import * as path from 'path';
import { Options } from 'yargs';
import { FlagsParsed } from '../commands/generate-vdm';

export function toGeneratorSDK(flags: FlagsParsed): GeneratorOptions {
  const result =  Object.entries(flags)
    .filter(([key, value]) => typeof value !== 'undefined' && generatorOptionsSDK.hasOwnProperty(key))
    .reduce((prev, [key, value]) => ({ ...prev, [key]: value }), {}) as GeneratorOptions;
  return result;
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

  if ( yargsString?.coerce?.name === 'resolve') {
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
