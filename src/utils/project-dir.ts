/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import Command from '@oclif/command';

export function getProjectDir(command: Command, flags: any, args: any): string {
  if (typeof flags.projectDir !== 'undefined' && typeof args.projectDir !== 'undefined' && flags.projectDir !== args.projectDir) {
    command.error(
      `Project directory was given via argument (${args.projectDir}) and via the \`--projectDir\` flag (${flags.projectDir}). Please provide only one.`,
      { exit: 1 }
    );
  }

  return flags.projectDir || args.projectDir || '.';
}
