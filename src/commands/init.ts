/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import { OutputFlags } from '@oclif/parser';
import cli from 'cli-ux';
import * as execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import { InitType, packageJsonParts } from '../utils/initialization-helper';
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
    frontendScripts: flags.boolean({
      hidden: true,
      description: 'Add frontend-related npm scripts which are needed for CI/CD.',
      exclusive: ['skipFrontendScripts']
    }),
    skipFrontendScripts: flags.boolean({
      hidden: true,
      description: 'Skip frontend-related npm scripts and dont ask to add them.',
      exclusive: ['frontendScripts']
    }),
    initWithExpress: flags.boolean({
      hidden: true,
      description: 'If the folder is empty, use express-generator to create a project scaffold.'
    }),
    projectDir: flags.string({
      default: '.',
      description: 'Path to the folder in which the project should be created.'
    }),
    force: flags.boolean({
      hidden: true,
      description: 'Overwrite files without asking if conflicts are found.'
    }),
    help: flags.help({
      char: 'h',
      description: 'Show help for the new command.'
    })
  };

  async run() {
    const { flags } = this.parse(Init);

    ensureDirectoryExistence(flags.projectDir, true);

    const initType = await this.determineInitializationType(flags);
    await this.initProject(flags, initType);

    const options = await this.getOptions(flags);

    try {
      cli.action.start('Reading templates');
      const excludes =
        initType === InitType.existingProject ? ['test', 'jest.config.js', 'jest.integration-test.config.js', 'jets.unit-test.config.js'] : [];
      const files = readTemplates({
        from: [path.resolve(__dirname, '..', 'templates', 'init')],
        to: flags.projectDir,
        exclude: excludes
      });
      cli.action.stop();

      cli.action.start('Finding potential conflicts');
      await findConflicts(files, flags.force, this.error);
      cli.action.stop();

      cli.action.start('Creating files');
      await copyFiles(files, options).catch(e => this.error(e, { exit: 2 }));
      cli.action.stop();

      cli.action.start('Adding dependencies to package.json');
      await this.modifyPackageJson(flags, initType);
      cli.action.stop();

      this.log('Installing dependencies');
      await this.installDependencies(flags);

      cli.action.start('Modify .gitignore');
      this.modifyGitIgnore(flags);
      cli.action.stop();

      this.printSuccessMessage();
    } catch (error) {
      this.error(error, { exit: 1 });
    }
  }

  private async determineInitializationType(flags: Flags): Promise<InitType> {
    if (fs.existsSync(path.resolve(flags.projectDir, 'package.json'))) {
      return InitType.existingProject;
    }

    this.log('This folder does not contain a `package.json`.');
    if (flags.initWithExpress || (await cli.confirm('Should a new `express.js` project be initialized in this folder?'))) {
      return InitType.freshExpress;
    }

    return InitType.existingProject;
  }

  private async initProject(flags: Flags, initializationType: InitType): Promise<void> {
    switch (initializationType) {
      case InitType.freshExpress:
        return this.initExpressProject(flags);
      case InitType.existingProject:
        return;
    }
  }

  private async initExpressProject(flags: Flags): Promise<void> {
    cli.action.start('Initializing Express project');

    const params = ['express-generator', '--no-view', '--git'];
    const dirEmpty = fs.readdirSync(flags.projectDir).length === 0;

    if (!dirEmpty && (flags.force || (await cli.confirm('Directory is not empty. Should the project be initialized anyway?')))) {
      params.push('--force');
    }
    await execa('npx', params, { cwd: flags.projectDir });

    if (!fs.existsSync('.git')) {
      await execa('git', ['init'], { cwd: flags.projectDir });
    }
    cli.action.stop();
  }

  private async getOptions(flags: Flags) {
    const options: { [key: string]: string } = {
      projectName:
        flags.projectName ||
        (await cli.prompt('Enter project name (for use in manifest.yml)', {
          default: this.packageJson(flags).name
        })),
      command:
        flags.startCommand ||
        (await cli.prompt('Enter the command to start your server', {
          default: this.packageJson(flags).scripts.start ? 'npm start' : ''
        }))
    };

    return options;
  }

  private packageJson(flags: Flags) {
    try {
      if (fs.existsSync(path.resolve(flags.projectDir, 'package.json'))) {
        return JSON.parse(
          fs.readFileSync(path.resolve(flags.projectDir, 'package.json'), {
            encoding: 'utf8'
          })
        );
      }
    } catch (error) {
      this.error('Your package.json does not contain valid JSON. Please repair or delete it.', { exit: 10 });
    }
  }

  private async modifyPackageJson(flags: Flags, initializationType: InitType) {
    const packageJsonData = packageJsonParts(initializationType);

    const untouchedPackageJson = this.packageJson(flags);
    const addFrontendScripts: boolean =
      flags.frontendScripts ||
      (!flags.skipFrontendScripts && (await cli.confirm('Should frontend-related npm scriptsToBeAdded for CI/CD be added?')));
    const backendScritps = { ...packageJsonData.backendBuildScripts, ...packageJsonData.backendTestScripts };
    const scriptsToBeAdded = addFrontendScripts ? { ...backendScritps, ...packageJsonData.frontendScripts } : backendScritps;
    const scriptsAlreadyThere = untouchedPackageJson.scripts;

    const conflicts = scriptsAlreadyThere ? Object.keys(scriptsToBeAdded).filter(name => Object.keys(scriptsAlreadyThere).includes(name)) : [];

    if (
      conflicts.length &&
      !(await cli.confirm(`Script(s) with the name(s) "${conflicts.join('", "')}" already exist(s). Should they be overwritten?`))
    ) {
      this.error('Script exits as npm scriptsToBeAdded could not be written.', {
        exit: 11
      });
    }

    const adjustedPackageJson = {
      ...this.packageJson(flags),
      scripts: { ...untouchedPackageJson.scripts, ...scriptsToBeAdded },
      dependencies: { ...untouchedPackageJson.dependencies, ...(await this.addDependencies(packageJsonData.dependencies)) },
      devDependencies: { ...untouchedPackageJson.devDependencies, ...(await this.addDependencies(packageJsonData.devDependencies)) }
    };

    fs.writeFileSync(path.resolve(flags.projectDir, 'package.json'), JSON.stringify(adjustedPackageJson, null, 2));
  }

  private async addDependencies(dependencies: string[]): Promise<{ [key: string]: string }> {
    const result: { [key: string]: string } = {};
    const versionLookups = dependencies.map(dependency => this.getVersionOfDependency(dependency).then(version => (result[dependency] = version)));
    return Promise.all(versionLookups).then(() => result);
  }

  private async getVersionOfDependency(dependency: string): Promise<string> {
    try {
      const defaultOptions = ['view', dependency, 'version'];
      const version = dependency.includes('@sap')
        ? execa('npm', [...defaultOptions, '--registry', 'https://npm.sap.com'])
        : execa('npm', defaultOptions);

      return `^${(await version).stdout}`;
    } catch (err) {
      this.warn(`Error in finding version for dependency ${dependency} - use LATEST as fallback.`);
      return 'latest';
    }
  }

  private async installDependencies(flags: Flags) {
    return execa('npm', ['install'], { cwd: flags.projectDir, stdout: 'inherit' }).catch(err => this.error(`Error in npm install ${err.message}`));
  }

  private modifyGitIgnore(flags: Flags) {
    const pathToGitignore = path.resolve(flags.projectDir, '.gitignore');
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

  private printSuccessMessage() {
    this.log('+---------------------------------------------------------------+');
    this.log('| ✅ Init finished successfully.                                |');
    this.log('|                                                               |');
    this.log('| 🚀 Next steps:                                                |');
    this.log('| 1. Make sure that your app listens to port 8080               |');
    this.log('| 2. Build your app if necessary                                |');
    this.log('| 3. Run `sap-cloud-sdk package [--include INC][--exclude EXC]` |');
    this.log('| 4. Push to Cloud Foundry (`cf push`)                          |');
    this.log('|                                                               |');
    this.log('| 🔨 Consider setting up Jenkins to continuously build your app |');
    this.log('| Use `sap-cloud-sdk add-cx-server` to create the setup script  |');
    this.log('+---------------------------------------------------------------+');
  }
}
