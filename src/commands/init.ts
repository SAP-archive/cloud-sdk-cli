/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command } from '@oclif/command';
import cli from 'cli-ux';
import * as fs from 'fs';
import * as Listr from 'listr';
import * as path from 'path';
import {
  buildScaffold,
  copyFiles,
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
import { initFlags } from '../utils/init-flags';
import { formatMessage } from '../utils/message-formatter';

export default class Init extends Command {
  static description = 'Initializes your project for the SAP Cloud SDK, SAP Cloud Platform Cloud Foundry and CI/CD using the SAP Cloud SDK toolkit';

  static examples = ['$ sap-cloud-sdk init', '$ sap-cloud-sdk init --help'];

  static flags = initFlags;

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
      fs.mkdirSync(projectDir, { recursive: true });
      const isScaffold = await shouldBuildScaffold(projectDir, flags.buildScaffold, flags.force);
      if (isScaffold) {
        await buildScaffold(projectDir, flags.verbose, flags.addCds);
      }
      const options = await this.getOptions(projectDir, isScaffold ? 'npm run start:prod' : flags.startCommand, flags.projectName);

      await usageAnalytics(projectDir, flags.analytics, flags.analyticsSalt);

      const tasks = new Listr([
        {
          title: 'Creating files',
          task: () => {
            const templates = ['init'];
            if (flags.addCds) {
              templates.push('add-cds');
              if (isScaffold) {
                templates.push('add-cds-scaffold');
              }
            }
            const copyDescriptors = getCopyDescriptors(projectDir, getTemplatePaths(templates));
            findConflicts(copyDescriptors, flags.force);
            copyFiles(copyDescriptors, options);
          }
        },
        {
          title: 'Modifying test config',
          task: () => modifyJestConfig(path.resolve(projectDir, 'test', 'jest-e2e.json'), getJestConfig(false)),
          enabled: () => isScaffold
        },
        {
          title: 'Adding dependencies to package.json',
          task: () => modifyPackageJson(projectDir, isScaffold, flags)
        },
        {
          title: 'Installing dependencies',
          task: () => installDependencies(projectDir, verbose).catch(e => this.error(`Error during npm install: ${e.message}`, { exit: 13 })),
          enabled: () => !flags.skipInstall
        },
        {
          title: 'Modifying `.gitignore`',
          task: () => modifyGitIgnore(projectDir)
        }
      ]);

      await tasks.run();

      this.printSuccessMessage(isScaffold, flags.addCds);
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

  private printSuccessMessage(isScaffold: boolean, addCds: boolean) {
    const message = ['✅ Init finished successfully.', '', '🚀 Next steps:'];

    if (addCds) {
      message.push('- Deploy your database locally (`npm run cds-deploy`)');
    }

    if (isScaffold) {
      message.push(...this.nextStepsScaffold());
    } else {
      if (addCds) {
        message.push(...this.nextStepsCdsNoScaffold());
      }
      message.push(...this.nextStepsNoScaffold());
    }

    message.push(
      '',
      '🔨 Consider setting up Jenkins to continuously build your app.',
      'Use `sap-cloud-sdk add-cx-server` to create the setup script.'
    );

    this.log(formatMessage(message));
  }

  private nextStepsNoScaffold() {
    return [
      '- Make sure that your app listens to `process.env.PORT`',
      '- Build your app if necessary',
      '- Run `sap-cloud-sdk package [--include INC][--exclude EXC]`',
      '- Push to Cloud Foundry (`cf push`)'
    ];
  }

  private nextStepsScaffold() {
    return ['- Run the application locally (`npm run start:dev`)', '- Deploy your application (`npm run deploy`)'];
  }

  private nextStepsCdsNoScaffold() {
    return [
      'Expose your service:',
      'For express apps add the following snippet to your code:',
      '',
      'cds',
      '  .connect()',
      "  .serve('CatalogService')",
      '  .in(<your-express-app>);',
      '',
      'For other frameworks please refer to the documentation.'
    ];
  }
}
