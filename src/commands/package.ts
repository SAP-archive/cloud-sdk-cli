/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as execa from 'execa';
import * as glob from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { ensureDirectoryExistence } from '../utils/templates';

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
    })
  };

  async run() {
    const { flags } = this.parse(Package);
    const outputDir = path.resolve(flags.projectDir, flags.output);

    cli.action.start(`Overwrite ${flags.output}`);
    try {
      if (fs.existsSync(outputDir)) {
        rm.sync(outputDir);
      }
      fs.mkdirSync(outputDir);
    } catch (error) {
      this.error(error, { exit: 1 });
    }
    cli.action.stop();

    cli.action.start('Copying files');
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
      ensureDirectoryExistence(path.resolve(outputDir, filepath));
      fs.copyFileSync(filepath, path.resolve(outputDir, filepath));
    });
    cli.action.stop();

    if (!flags.skipInstall) {
      cli.action.start('Install productive dependencies');
      try {
        await execa('npm', ['install', '--production', '--prefix', outputDir]);
      } catch (error) {
        this.error(error, { exit: 10 });
      }
      cli.action.stop();
    }
  }
}
