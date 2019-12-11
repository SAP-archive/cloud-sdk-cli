/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as Listr from 'listr';
import * as path from 'path';
import {
  buildScaffold,
  copyFiles,
  ensureDirectoryExists,
  findConflicts,
  getCopyDescriptors,
  getJestConfig,
  getTemplatePaths,
  installDependencies,
  modifyGitIgnore,
  modifyJestConfig,
  modifyPackageJson,
  parsePackageJson,
  shouldBuildScaffold,
  usageAnalytics
} from '../utils/';

export default class Init extends Command {
  static description = 'Initializes your project for the SAP Cloud SDK, SAP Cloud Platform Cloud Foundry and CI/CD using the SAP Cloud SDK toolkit';

  static examples = ['$ sap-cloud-sdk init', '$ sap-cloud-sdk init --help'];

  static flags = {
    projectDir: flags.string({
      description: 'Path to the folder in which the project should be created.'
    }),
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
    analyticsSalt: flags.string({
      hidden: true,
      description: 'Set salt for analytics. This should only be used for CI builds.'
    }),
    analytics: flags.boolean({
      hidden: true,
      allowNo: true,
      description: 'Enable or disable collection of anonymous usage data.'
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
    })
  };

  static args = [
    {
      name: 'projectDir',
      description: 'Path to the folder in which the project should be created.'
    }
  ];

  async run() {
    const { flags, args } = this.parse(Init);
    const { verbose } = flags;

    if (typeof flags.projectDir !== 'undefined' && typeof args.projectDir !== 'undefined' && flags.projectDir !== args.projectDir) {
      this.error(
        `Project directory was given via argument (${args.projectDir}) and via the \`--projectDir\` flag (${flags.projectDir}). Please only provide one.`,
        { exit: 1 }
      );
    }

    const projectDir: string = flags.projectDir || args.projectDir || '.';

    try {
      ensureDirectoryExists(projectDir, true);
      const isScaffold = await shouldBuildScaffold(projectDir, flags.buildScaffold, flags.force);
      if (isScaffold) {
        await buildScaffold(projectDir, flags.verbose);
      }
      const options = await this.getOptions(projectDir, isScaffold ? 'npm run start:prod' : flags.startCommand, flags.projectName);

      await usageAnalytics(projectDir, flags.analytics, flags.analyticsSalt);

      const tasks = new Listr([
        {
          title: 'Reading templates',
          task: ctx => {
            ctx.copyDescriptors = getCopyDescriptors(projectDir, getTemplatePaths(['init']));
          }
        },
        {
          title: 'Finding potential conflicts',
          task: ctx => findConflicts(ctx.copyDescriptors, flags.force)
        },
        {
          title: 'Creating files',
          task: ctx => copyFiles(ctx.copyDescriptors, options)
        },
        {
          title: 'Modifying test config',
          task: () => modifyJestConfig(path.resolve(projectDir, 'test', 'jest-e2e.json'), getJestConfig(false)),
          enabled: () => isScaffold
        },
        {
          title: 'Adding dependencies to package.json',
          task: () => modifyPackageJson(projectDir, isScaffold, flags.frontendScripts, flags.force)
        },
        {
          title: 'Installing dependencies',
          task: () => installDependencies(projectDir, verbose).catch(e => this.error(`Error during npm install: ${e.message}`, { exit: 13 }))
        },
        {
          title: 'Modifying `.gitignore`',
          task: () => modifyGitIgnore(projectDir)
        }
      ]);

      await tasks.run();

      this.printSuccessMessage(isScaffold);
    } catch (error) {
      this.error(error, { exit: 1 });
    }
  }

  private async getOptions(projectDir: string, startCommand?: string, projectName?: string) {
    const { name, scripts } = parsePackageJson(projectDir);

    const options: { [key: string]: string } = {
      projectName:
        projectName ||
        (await cli.prompt('Enter project name (for use in manifest.yml)', {
          default: name
        })),
      command:
        startCommand ||
        (await cli.prompt('Enter the command to start your application', {
          default: scripts.start ? 'npm start' : ''
        }))
    };

    return options;
  }

  private printSuccessMessage(isScaffold: boolean) {
    this.log('+---------------------------------------------------------------+');
    this.log('| ✅ Init finished successfully.                                |');
    this.log('|                                                               |');
    this.log('| 🚀 Next steps:                                                |');

    isScaffold ? this.printNextStepsScaffold() : this.printNextStepsBase();

    this.log('|                                                               |');
    this.log('| 🔨 Consider setting up Jenkins to continuously build your app |');
    this.log('| Use `sap-cloud-sdk add-cx-server` to create the setup script  |');
    this.log('+---------------------------------------------------------------+');
  }

  private printNextStepsBase() {
    this.log('| 1. Make sure that your app listens to `process.env.PORT`      |');
    this.log('| 2. Build your app if necessary                                |');
    this.log('| 3. Run `sap-cloud-sdk package [--include INC][--exclude EXC]` |');
    this.log('| 4. Push to Cloud Foundry (`cf push`)                          |');
  }

  private printNextStepsScaffold() {
    this.log('| - Run the application locally (`npm run start:dev`)           |');
    this.log('| - Deploy your application (`npm run deploy`)                  |');
  }
}
