/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { flags } from '@oclif/command';
import { OutputFlags } from '@oclif/parser';

export const initFlags = {
  // visible
  projectDir: flags.string({
    description: 'Path to the folder in which the project should be created.'
  }),
  force: flags.boolean({
    description: 'Do not fail if a file or npm script already exist and overwrite it.'
  }),
  frontendScripts: flags.boolean({
    description: 'Add frontend-related npm scripts which are executed by our CI/CD toolkit.'
  }),
  help: flags.help({
    char: 'h',
    description: 'Show help for the new command.'
  }),
  verbose: flags.boolean({
    char: 'v',
    description: 'Show more detailed output.'
  }),
  // hidden
  projectName: flags.string({
    hidden: true,
    description: 'Give project name which is used for the Cloud Foundry mainfest.yml'
  }),
  startCommand: flags.string({
    hidden: true,
    description: 'Give a command which is used to start the application productively.'
  }),
  buildScaffold: flags.boolean({
    hidden: true,
    description: 'If the folder is empty, use nest-cli to create a project scaffold.'
  }),
  analytics: flags.boolean({
    hidden: true,
    allowNo: true,
    description: 'Enable or disable collection of anonymous usage data.'
  }),
  analyticsSalt: flags.string({
    hidden: true,
    description: 'Set salt for analytics. This should only be used for CI builds.'
  })
};

export type InitFlags = OutputFlags<typeof initFlags>;
