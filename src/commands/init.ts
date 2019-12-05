/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import { OutputFlags } from '@oclif/parser';
import cli from 'cli-ux';
import * as execa from 'execa';
import * as fs from 'fs';
import * as Listr from 'listr';
import * as path from 'path';
import * as rm from 'rimraf';
import { installDependencies, modifyPackageJson, parsePackageJson } from '../utils/package-json';
import { copyFiles, ensureDirectoryExistence, findConflicts, readTemplates } from '../utils/templates';

type Flags = OutputFlags<typeof Init.flags>;

export default class Init extends Command {
  static description = 'Initializes your project for the SAP Cloud SDK, SAP Cloud Platform Cloud Foundry and CI/CD using the SAP Cloud SDK toolkit';

  static examples = ['$ sap-cloud-sdk init', '$ sap-cloud-sdk init --help'];

  static flags = {
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
    force: flags.boolean({
      description: 'Do not fail if a file or npm script already exist and overwrite it.'
    }),
    frontendScripts: flags.boolean({
      description: 'Add frontend-related npm scripts which are executed by our CI/CD toolkit.'
    }),
    projectDir: flags.string({
      description: 'Path to the folder in which the project should be created.'
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
      ensureDirectoryExistence(projectDir, true);
      const buildScaffold = await this.shouldBuildScaffold(projectDir, flags);
      if (buildScaffold) {
        await this.buildScaffold(projectDir, flags.verbose);
      }
      const options = await this.getOptions(projectDir, buildScaffold ? 'npm run start:prod' : flags.startCommand, flags.projectName);

      const tasks = new Listr([
        {
          title: 'Reading templates',
          task: async ctx => {
            ctx.files = readTemplates({
              from: [path.resolve(__dirname, '..', 'templates', 'init')],
              to: projectDir
            });
          }
        },
        {
          title: 'Finding potential conflicts',
          task: ctx => findConflicts(ctx.files, flags.force)
        },
        {
          title: 'Creating files',
          task: ctx => copyFiles(ctx.files, options).catch(e => this.error(e, { exit: 2 }))
        },
        {
          title: 'Adding dependencies to package.json',
          task: () => modifyPackageJson(projectDir, buildScaffold, flags.frontendScripts, flags.force)
        },
        {
          title: 'Installing dependencies',
          task: () => installDependencies(projectDir, verbose).catch(e => this.error(`Error during npm install: ${e.message}`, { exit: 2 }))
        },
        {
          title: 'Modifying `.gitignore`',
          task: () => this.modifyGitIgnore(projectDir)
        }
      ]);

      await tasks.run();
      this.printSuccessMessage(buildScaffold);
    } catch (error) {
      this.error(error, { exit: 1 });
    }
  }

  private async shouldBuildScaffold(projectDir: string, { buildScaffold, force }: Flags): Promise<boolean> {
    if (buildScaffold) {
      return true;
    }

    if (fs.existsSync(path.resolve(projectDir, 'package.json'))) {
      return false;
    }

    this.log('This folder does not contain a `package.json`.');

    if (await cli.confirm('Should a new `nest.js` project be initialized in this folder?')) {
      if (fs.readdirSync(projectDir).length !== 0) {
        const dirString = projectDir === '.' ? 'this directory' : projectDir;
        if (force || (await cli.confirm(`Directory is not empty. Should all files in ${dirString} be removed?`))) {
          rm.sync(`${projectDir}/{*,.*}`);
        }
      }
      return true;
    }
    this.warn('Cancelling `init` because a valid `package.json` is required to run.');
    return this.exit(1);
  }

  private async buildScaffold(projectDir: string, verbose: boolean) {
    cli.action.start('Building application scaffold');
    const cliPath = path.resolve('node_modules/.bin/nest');
    const options: execa.Options = {
      cwd: projectDir,
      stdio: verbose ? 'inherit' : 'ignore'
    };

    if (fs.existsSync(cliPath)) {
      await execa(cliPath, ['new', '.', '--skip-install', '--package-manager', 'npm'], options);
    } else {
      await execa('npx', ['@nestjs/cli', 'new', '.', '--skip-install', '--package-manager', 'npm'], options);
    }

    const pathToMainTs = path.resolve(projectDir, 'src', 'main.ts');
    const mainTs = fs.readFileSync(pathToMainTs, { encoding: 'utf8' });
    const modifiedMainTs = mainTs.replace('.listen(3000)', '.listen(process.env.PORT || 3000)');

    if (mainTs === modifiedMainTs) {
      this.warn('Could not adjust listening port to `process.env.PORT`. Please adjust manually.');
    }

    fs.writeFileSync(pathToMainTs, modifiedMainTs);
    cli.action.stop();
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

  private modifyGitIgnore(projectDir: string) {
    const pathToGitignore = path.resolve(projectDir, '.gitignore');
    const pathsToIgnore = ['credentials.json', '/s4hana_pipeline', '/deployment'];

    if (fs.existsSync(pathToGitignore)) {
      try {
        const fileContent = fs.readFileSync(pathToGitignore, 'utf8');
        const newPaths = pathsToIgnore.filter(path => !fileContent.includes(path));
        const newFileContent = fileContent + (newPaths.length ? `\n${newPaths.join('\n')}\n` : '');

        fs.writeFileSync(pathToGitignore, newFileContent, 'utf8');
      } catch (error) {
        this.warn('There was a problem writing to the .gitignore.');
        this.log('If your project is using a different version control system, please make sure the following paths are not tracked:');
        pathsToIgnore.forEach(path => this.log('  ' + path));
      }
    } else {
      this.warn('No .gitignore file found!');
      this.log('If your project is using a different version control system, please make sure the following paths are not tracked:');
    }
  }

  private printSuccessMessage(buildScaffold: boolean) {
    this.log('+---------------------------------------------------------------+');
    this.log('| ✅ Init finished successfully.                                |');
    this.log('|                                                               |');
    this.log('| 🚀 Next steps:                                                |');

    buildScaffold ? this.printNextStepsScaffold() : this.printNextStepsBase();

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
