/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import * as execa from 'execa';
import * as glob from 'fast-glob';
import * as fs from 'fs';
import * as Listr from 'listr';
import * as path from 'path';
import * as rm from 'rimraf';
import { ensureDirectoryExists } from '../utils/templates';

export default class Package extends Command {
  static description = 'Copies the specified files to the deployment folder';

  static examples = [
    '$ sap-cloud-sdk package',
    '$ sap-cloud-sdk package -i="index.html"',
    '$ sap-cloud-sdk package --include="package.json,package-lock.json,index.js,dist/**/*" --exclude="**/*.java"'
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
    output: flags.string({
      char: 'o',
      default: 'deployment',
      description: 'Output and deployment folder'
    }),
    skipInstall: flags.boolean({
      default: false,
      description: 'Skip `npm i --production` during packaging'
    }),
    projectDir: flags.string({
      hidden: true,
      default: '',
      description: 'Path to the folder in which the project should be created.'
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

  async run() {
    const { flags } = this.parse(Package);
    const outputDir = path.resolve(flags.projectDir, flags.output);

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
            cwd: flags.projectDir
          });
          const exclude: string[] = flags.exclude.length
            ? await glob(flags.exclude.split(','), {
                dot: true,
                absolute: true,
                cwd: flags.projectDir
              })
            : [];
          const filtered = include.filter(filepath => !exclude.includes(filepath)).map(filepath => path.relative(flags.projectDir, filepath));

          filtered.forEach(filepath => {
            ensureDirectoryExists(path.resolve(outputDir, filepath));
            fs.copyFileSync(filepath, path.resolve(outputDir, filepath));
          });
        }
      },
      {
        title: 'Install productive dependencies',
        enabled: () => !flags.skipInstall,
        task: async () => {
          execa('npm', ['install', '--production', '--prefix', outputDir], { stdio: flags.verbose ? 'inherit' : 'ignore' }).catch(e =>
            this.error(e, { exit: 10 })
          );
        }
      }
    ]);
    tasks.run();
  }
}
