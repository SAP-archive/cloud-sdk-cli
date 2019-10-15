/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import { OutputFlags } from '@oclif/parser';
import cli from 'cli-ux';
import * as execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import { copyFiles, ensureDirectoryExistence, findConflicts, readTemplates } from '../utils/templates';
import { CopyDescriptor } from '../utils/copy-list';
import { InitializationType, InitTypeHelper } from '../utils/initialization-helper';

const backendBuildScripts = {
  'ci-build': 'echo "Use this to compile or minify your application"',
  'ci-package': 'echo "Copy all deployment-relevant files to the `deployment` folder"'
};


// TODO Autodetect testing framework (?) and make sure it outputs junit
const frontendScripts = {
  'ci-e2e': 'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/e2e/`"',
  'ci-frontend-unit-test':
    'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-integration/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-integration/`"'
};

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

  // type flagsType = typeof Init.flags;

  async run() {
    const { flags } = this.parse(Init);

    ensureDirectoryExistence(flags.projectDir, true);

    const initializationType = await this.determineInitializationType(flags);
    await this.initProject(flags, initializationType);

    const options = await this.getOptions();

    try {
      cli.action.start('Reading templates');
      const files = readTemplates([path.resolve(__dirname, '..', 'templates', 'init')], flags.projectDir, ['test']);
      this.readTestTemplatesFiles(flags.projectDir, initializationType).forEach(file => files.push(file));
      cli.action.stop();

      cli.action.start('Finding potential conflicts');
      await findConflicts(files, flags.force, this.error);
      cli.action.stop();

      cli.action.start('Creating files');
      copyFiles(files, options, this.error);
      cli.action.stop();

      cli.action.start('Adding scripts for CI/CD and dependencies to package.json');
      await this.modifyPackageJson(initializationType);
      cli.action.stop();

      cli.action.start('Modify .gitignore');
      this.modifyGitIgnore();
      cli.action.stop();

      this.printSuccessMessage();
    } catch (error) {
      this.error(error, { exit: 1 });
    }
  }

  private async determineInitializationType(flags: OutputFlags<typeof Init.flags>): Promise<InitializationType> {
    if (fs.existsSync(path.resolve(flags.projectDir, 'package.json'))) {
      return InitializationType.existingProject;
    }

    this.log('This folder does not contain a `package.json`.');
    if (flags.initWithExpress || (await cli.confirm('Should a new `express.js` project be initialized in this folder?'))) {
      return InitializationType.freshExpress;
    }

    return InitializationType.existingProject;
  }

  private async initProject(flags: OutputFlags<typeof Init.flags>, initializationType: InitializationType) {
    switch (initializationType) {
      case InitializationType.freshExpress:
        this.initExpressProject(flags);
        return;
      case InitializationType.existingProject:
        return;
    }
  }

  private async initExpressProject(flags: OutputFlags<typeof Init.flags>) {
    cli.action.start('Initializing project');

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

  private async getOptions() {
    const { flags } = this.parse(Init);

    const options: { [key: string]: string } = {
      projectName:
        flags.projectName ||
        (await cli.prompt('Enter project name (for use in manifest.yml)', {
          default: this.packageJson().name
        })),
      command:
        flags.startCommand ||
        (await cli.prompt('Enter the command to start your server', {
          default: this.packageJson().scripts.start ? 'npm start' : ''
        }))
    };

    return options;
  }

  private packageJson() {
    const { flags } = this.parse(Init);
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

  private async modifyPackageJson(initializationType: InitializationType) {
    const { flags } = this.parse(Init);
    const packJsonParts = InitTypeHelper.packageJsonParts(initializationType);

    const packageJson = this.packageJson();
    const addFrontendScripts: boolean =
      flags.frontendScripts || (!flags.skipFrontendScripts && (await cli.confirm('Should frontend-related npm scripts for CI/CD be added?')));
    const backendScritps = { ...backendBuildScripts, ...packJsonParts.backendTestScripts };
    const scripts = addFrontendScripts ? { ...backendScritps, ...frontendScripts } : backendScritps;

    const conflicts = packageJson.scripts ? Object.keys(scripts).filter(name => Object.keys(packageJson.scripts).includes(name)) : [];

    if (
      conflicts.length &&
      !(await cli.confirm(`Script(s) with the name(s) "${conflicts.join('", "')}" already exist(s). Should they be overwritten?`))
    ) {
      this.error('Script exits as npm scripts could not be written.', {
        exit: 11
      });
    }
    packageJson.scripts = { ...packageJson.scripts, ...scripts };
    if (packageJson.devDependencies !== undefined) {
      packageJson.devDependencies = { ...packageJson.devDependencies, ...packJsonParts.devDependencies };
    } else {
      packageJson.devDependencies = packJsonParts.devDependencies;
    }

    fs.writeFileSync(path.resolve(flags.projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    try {
      await execa('npm', ['install', '@sap/cloud-sdk-core'], {
        cwd: flags.projectDir
      });
      await execa('npm', ['install', '--save-dev', '@sap/cloud-sdk-test-util'], { cwd: flags.projectDir });
    } catch (error) {
      this.error(error, { exit: 12 });
    }
  }

  private modifyGitIgnore() {
    const { flags } = this.parse(Init);
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

  //Discuss if one should put this as static to the templates.ts?
  private readTestTemplatesFiles(toDirectory: string, initializationType: InitializationType): CopyDescriptor[] {
    switch (initializationType) {
      case InitializationType.existingProject:
        return [];
      case InitializationType.freshExpress:
        const fromDirectory = path.resolve(__dirname, '..', 'templates', 'init', 'test');
        const testFiles = fs.readdirSync(fromDirectory, { withFileTypes: true });
        //TODO make this more elegant
        return testFiles.map((file) => {
          if (file.name.includes('unit-test')) {
            return {
              sourcePath: path.resolve(fromDirectory, file.name),
              targetFolder: path.resolve(toDirectory, 'unit-tests'),
              fileName: path.resolve(toDirectory, 'unit-tests', file.name)
            };
          }
          ;
          //TODO undifined error on run henece return alwyas ?1?
          // if (file.name.includes('integration-test')) {
          return {
            sourcePath: path.resolve(fromDirectory, file.name),
            targetFolder: path.resolve(toDirectory, 'integration-tests'),
            fileName: path.resolve(toDirectory, 'integration-tests', file.name)
          };
          // };
        });
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


