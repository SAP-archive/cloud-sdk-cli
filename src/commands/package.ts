/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */

import * as fs from 'fs';
import * as path from 'path';
import { Command, flags } from '@oclif/command';
import * as glob from 'fast-glob';
import * as Listr from 'listr';
import * as rm from 'rimraf';
import {
  boxMessage,
  checkOldDependencies,
  getWarnings,
  parsePackageJson
} from '../utils';

interface Context {
  parsed: {
    flags: any;
    args: any;
  };
  outputDir: string;
  projectDir: string;
}

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
    ci: flags.boolean({
      default: false,
      description:
        'Add node_modules in production environments to respect the `build once` principle.'
    }),
    include: flags.string({
      char: 'i',
      default: 'package.json,package-lock.json,index.js,dist/**/*',
      description: 'Comma seperated list of files or globs to include'
    }),
    exclude: flags.string({
      char: 'e',
      default: '',
      description: 'Comma separated list of files or globs to exclude'
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

  async run(): Promise<void> {
    const parsed = this.parse(Package);
    const projectDir = parsed.args.projectDir || '.';
    const outputDir = path.resolve(projectDir, parsed.flags.output);

    const tasks = new Listr([
      {
        title: 'Read flags',
        task: ctx => {
          ctx.parsed = parsed;
          ctx.projectDir = projectDir;
          ctx.outputDir = outputDir;
        }
      },
      {
        title: `Overwrite ${parsed.flags.output}`,
        task: this.overwrite
      },
      {
        title: 'Copying files',
        task: this.copyFiles
      },
      {
        title: 'Copying node_modules for ci',
        enabled: () => parsed.flags.ci,
        task: this.copyNodeModules
      },
      {
        title: 'Check the SAP Cloud SDK dependencies',
        task: this.checkSDKDependencies
      }
    ]);

    await tasks.run();
    this.printSuccessMessage();
  }

  overwrite(ctx: Context): void {
    try {
      if (fs.existsSync(ctx.outputDir!)) {
        rm.sync(ctx.outputDir!);
      }
      fs.mkdirSync(ctx.outputDir!);
    } catch (error) {
      this.error(error, { exit: 1 });
    }
  }

  async copyFiles(ctx: Context): Promise<void> {
    const include = await glob(ctx.parsed.flags.include.split(','), {
      dot: true,
      absolute: true,
      cwd: ctx.projectDir
    });
    const exclude: string[] =
      ctx.parsed.flags.exclude.length > 0
        ? await glob(ctx.parsed.flags.exclude.split(','), {
            dot: true,
            absolute: true,
            cwd: ctx.projectDir
          })
        : [];
    const filtered = include.filter(filepath => !exclude.includes(filepath));

    copyFilesTo(filtered, ctx.outputDir, ctx.projectDir);
  }

  async copyNodeModules(ctx: Context): Promise<void> {
    const nodeModuleFiles = await glob('node_modules/**/*', {
      dot: true,
      absolute: true,
      cwd: ctx.projectDir
    });

    copyFilesTo(nodeModuleFiles, ctx.outputDir, ctx.projectDir);
  }

  async checkSDKDependencies(ctx: Context): Promise<void> {
    const { dependencies, devDependencies } = await parsePackageJson(
      ctx.projectDir
    );
    checkOldDependencies(dependencies);
    checkOldDependencies(devDependencies);
  }

  printSuccessMessage(): void {
    const warnings = getWarnings();
    const body = [
      '🚀 Please migrate to new packages.',
      'Please find how to migrate here:',
      'https://sap.github.io/cloud-sdk/docs/js/guides/migrate-to-open-source-version-of-cloud-sdk-for-javascript-typescript/'
    ];
    if (warnings) {
      if (this.hasOldSDKWarnings(warnings)) {
        this.log(
          boxMessage([
            '⚠️ Package finished with warnings:',
            ...warnings,
            '',
            ...body
          ])
        );
      } else {
        this.log(
          boxMessage(['⚠️ Package finished with warnings:', ...warnings])
        );
      }
    } else {
      this.log(boxMessage(['✅ Package finished successfully.']));
    }
  }

  hasOldSDKWarnings(warnings: string[]): boolean {
    const regex = new RegExp('Old SAP Cloud SDK: .* is detected.');
    return (
      warnings.map(warning => regex.test(warning)).filter(value => value)
        .length > 0
    );
  }
}

function copyFilesTo(
  filePaths: string[],
  outputDir: string,
  projectDir: string
): void {
  filePaths.forEach(filepath => {
    const outputFilePath = path.resolve(
      outputDir,
      path.relative(projectDir, filepath)
    );
    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.copyFileSync(filepath, outputFilePath);
  });
}
