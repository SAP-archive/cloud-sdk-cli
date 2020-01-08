/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as fs from 'fs';
import * as Listr from 'listr';
import * as path from 'path';
import { boxMessage, getWarnings } from '../utils';
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

export default class Init extends Command {
  static description = 'Initializes your project for the SAP Cloud SDK, SAP Cloud Platform Cloud Foundry and CI/CD using the SAP Cloud SDK toolkit';

  static examples = ['$ sap-cloud-sdk init', '$ sap-cloud-sdk init --help'];

  static flags = {
    // visible
    projectDir: flags.string({
      description: 'Path to the directory in which the project should be created.'
    }),
    addCds: flags.boolean({
      description: 'Add a cds configuration and example data to follow the SAP Cloud Application Promgramming model.'
    }),
    force: flags.boolean({
      description: 'Do not fail if a file or npm script already exist and overwrite it.'
    }),
    frontendScripts: flags.boolean({
      description: 'Add frontend-related npm scripts which are executed by our CI/CD toolkit.'
    }),
    help: flags.help({
      char: 'h',
      description: 'Show help for the init command.'
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'Show more detailed output.'
    }),
    // hidden
    projectName: flags.string({
      hidden: true,
      description: 'Give project name which is used for the Cloud Foundry mainfest.yml.'
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
    }),
    skipInstall: flags.boolean({
      hidden: true,
      description: 'Skip installing npm dependencies. If you use this, make sure to install manually afterwards.'
    })
  };

  static args = [
    {
      name: 'projectDir',
      description: 'Path to the directory in which the project should be created.'
    }
  ];

  async run() {
    const { flags, args } = this.parse(Init);
    const projectDir = args.projectDir || '.';

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
            const copyDescriptors = getCopyDescriptors(projectDir, getTemplatePaths(this.getTemplateNames(isScaffold, flags.addCds)));
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
          task: () => modifyPackageJson({ projectDir, isScaffold, frontendScripts: flags.frontendScripts, force: flags.force, addCds: flags.addCds })
        },
        {
          title: 'Installing dependencies',
          task: () => installDependencies(projectDir, flags.verbose).catch(e => this.error(`Error during npm install: ${e.message}`, { exit: 13 })),
          enabled: () => !flags.skipInstall
        },
        {
          title: 'Modifying `.gitignore`',
          task: () => modifyGitIgnore(projectDir, flags.addCds)
        }
      ]);

      await tasks.run();

      this.printSuccessMessage(isScaffold, flags.addCds);
    } catch (error) {
      this.error(error, { exit: 1 });
    }
  }

  private getTemplateNames(isScaffold: boolean, addCds: boolean): string[] {
    const templates = ['init'];
    if (addCds) {
      templates.push('add-cds');
      if (isScaffold) {
        templates.push('add-cds-scaffold');
      }
    }

    return templates;
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
    const warnings = getWarnings();
    const body = [
      '🚀 Next steps:',
      ...this.getNextSteps(isScaffold, addCds),
      '',
      '🔨 Consider setting up Jenkins to continuously build your app.',
      'Use `sap-cloud-sdk add-cx-server` to create the setup script.'
    ];

    if (warnings) {
      this.log(boxMessage(['➡️  Init finished with warnings.', '', ...warnings, '', ...body]));
    } else {
      this.log(boxMessage(['✅ Init finished successfully.', '', ...body]));
    }
  }

  private getNextSteps(isScaffold: boolean, addCds: boolean): string[] {
    const message = [];
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

    return message;
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
