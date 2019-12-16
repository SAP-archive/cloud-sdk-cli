/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { flags } from '@oclif/command';
import { AlphabetLowercase, AlphabetUppercase } from '@oclif/parser/lib/alphabet';
import { IBooleanFlag, IOptionFlag } from '@oclif/parser/lib/flags';
import { GeneratorOptions } from '@sap/cloud-sdk-generator';
import * as path from 'path';
import { Options } from 'yargs';
import { AllKeysTest, FlagsParsed, generatorOptionCLI } from '../commands/generate-vdm';

export function toGeneratorSDK(flags: FlagsParsed): GeneratorOptions {
  const result: Partial<GeneratorOptions> = {};
  Object.keys(flags).forEach((key: string) => {
    const keyTyped = key as AllKeysTest;
    const value = flags[keyTyped];

    if (value !== undefined && !generatorOptionCLI.hasOwnProperty(keyTyped)) {
      if (typeof value === 'boolean' && keyTyped) {
        (result[keyTyped as keyof GeneratorOptions] as boolean) = value;
      }
      if (typeof value === 'string') {
        (result[keyTyped as keyof GeneratorOptions] as string) = value;
      }
    }
  });
  return result as GeneratorOptions;
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

  if (yargsString.coerce && yargsString.coerce.name === 'resolve') {
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
