/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import * as execa from 'execa';
import * as glob from 'fast-glob';
import * as fs from 'fs';
import * as Listr from 'listr';
import { platform } from 'os';
import * as path from 'path';
import * as rm from 'rimraf';
import { boxMessage, checkOldDependencies, getWarnings, parsePackageJson } from '../utils';

export default class Package extends Command {
  static description = 'Copies the specified files to the deployment folder';

  static examples = [
    '$ sap-cloud-sdk package',
    '$ sap-cloud-sdk package -i="index.html"',
    '$ sap-cloud-sdk package --include="package.json,package-lock.json,index.js,dist/**/*" --exclude="**/*.java"'
  ];

  static flags = {
    help: flags.help({
      char: 'h',
      description: 'Show help for the package command.'
    }),
    output: flags.string({
      char: 'o',
      default: 'deployment',
      description: 'Output and deployment folder'
    }),
    skipInstall: flags.boolean({
      default: false,
      description: 'Skip `npm i --production` during packaging'
    }),
    include: flags.string({
      char: 'i',
      default: 'package.json,package-lock.json,index.js,dist/**/*',
      description: 'Comma seperated list of files or globs to include'
    }),
    exclude: flags.string({
      char: 'e',
      default: '',
      description: 'Comma seperated list of files or globs to exclude'
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'Show more detailed output.'
    })
  };

  static args = [
    {
      name: 'projectDir',
      description: 'Path to the project directory that shall be packaged.'
    }
  ];

  async run() {
    const { flags, args } = this.parse(Package);
    const projectDir = args.projectDir || '.';
    const outputDir = path.resolve(projectDir, flags.output);

    const tasks = new Listr([
      {
        title: `Overwrite ${flags.output}`,
        task: () => {
          try {
            if (fs.existsSync(outputDir)) {
              rm.sync(outputDir);
            }
            fs.mkdirSync(outputDir);
          } catch (error) {
            this.error(error, { exit: 1 });
          }
        }
      },
      {
        title: 'Copying files',
        task: async () => {
          const include = await glob(flags.include.split(','), {
            dot: true,
            absolute: true,
            cwd: projectDir
          });
          const exclude: string[] = flags.exclude.length
            ? await glob(flags.exclude.split(','), {
                dot: true,
                absolute: true,
                cwd: projectDir
              })
            : [];
          const filtered = include.filter(filepath => !exclude.includes(filepath));

          filtered.forEach(filepath => {
            const outputFilePath = path.resolve(outputDir, path.relative(projectDir, filepath));
            fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
            fs.copyFileSync(filepath, outputFilePath);
          });
        }
      },
      {
        title: 'Install productive dependencies',
        enabled: () => !flags.skipInstall,
        task: async () =>
          execa('npm', ['install', '--production', `--prefix=${outputDir}`, ...(platform() === 'win32' ? ['--force'] : [])], {
            stdio: flags.verbose ? 'inherit' : 'ignore'
          }).catch(e => this.error(e, { exit: 10 }))
      },
      {
        title: 'Check the SAP Cloud SDK dependencies',
        task: async () => {
          const { dependencies, devDependencies } = await parsePackageJson(outputDir);
          checkOldDependencies(dependencies);
          checkOldDependencies(devDependencies);
        }
      }
    ]);

    await tasks.run();
    this.printSuccessMessage();
  }

  private printSuccessMessage() {
    const warnings = getWarnings();
    const body = ['🚀 Please migrate to new packages.', 'Please find how to migrate here:', 'https://github.com/SAP/cloud-sdk/blob/master/docs/how-to-switch-to-os-cloud-sdk.md'];
    if (warnings) {
      this.log(boxMessage(['⚠️ Package finished with warnings:', ...warnings, '', ...body]));
    } else {
      this.log(boxMessage(['✅ Package finished successfully.']));
    }
  }
}
