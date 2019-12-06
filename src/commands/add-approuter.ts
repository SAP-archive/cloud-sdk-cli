/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as Listr from 'listr';
import * as path from 'path';
import { copyFiles, findConflicts, readTemplates } from '../utils/templates';

export default class AddApprouter extends Command {
  static description = 'Setup your Cloud Foundry app to authenticate through the app router';
  static aliases = ['add-app-router'];
  static examples = ['$ sap-cloud-sdk add-approuter'];

  static flags = {
    projectDir: flags.string({
      hidden: true,
      default: '',
      description: 'Path to the folder in which the project should be created.'
    }),
    force: flags.boolean({
      description: 'Do not fail if a file already exist and overwrite it.'
    }),
    help: flags.help({ char: 'h' })
  };

  async run() {
    const { flags } = this.parse(AddApprouter);
    try {
      const options = await this.getOptions();
      const tasks = new Listr([
        {
          title: 'Reading templates',
          task: ctx => {
            ctx.files = readTemplates({ from: [path.resolve(__dirname, '..', 'templates', 'add-approuter')], to: flags.projectDir });
          }
        },
        {
          title: 'Finding potential conflicts',
          task: ctx => findConflicts(ctx.files, flags.force)
        },
        {
          title: 'Creating files',
          task: ctx => copyFiles(ctx.files, options)
        }
      ]);

      await tasks.run();

      this.printSuccessMessage();
    } catch (error) {
      this.error(error, { exit: 1 });
    }
  }

  private async getOptions() {
    const warn = () => this.warn('Could not read name from `manifest.yml`. Please ensure you ran `sap-cloud-sdk init` before adding the approuter.');
    let projectName: string | null = null;
    try {
      const manifestStr = fs.readFileSync('manifest.yml', { encoding: 'utf8' });
      const manifest = yaml.safeLoad(manifestStr, {
        filename: 'manifest.yml',
        onWarning: warn
      });
      if (manifest['applications'].length > 1) {
        this.warn('There were multiple apps in the `manifest.yml`, this command only considers the first app.');
      }
      projectName = manifest['applications'].map((app: any) => app.name)[0];
    } catch (error) {
      this.log(`Unable to read "manifest.yml" (${error.message}).`);
    }

    const options: { [key: string]: string } = {
      projectName: projectName || (await cli.prompt('Enter project name as maintained in Cloud Foundry'))
    };

    return options;
  }

  private printSuccessMessage() {
    this.log(
      `✅ Successfully added approuter to your project.

Generated files might need customization. Documentation available here:
- xs-security.json (for help check https://help.sap.com/viewer/4505d0bdaf4948449b7f7379d24d0f0d/2.0.02/en-US/e6fc90df44464a29952e1c2c36dd9861.html)
- xs-app.json (for help check https://help.sap.com/viewer/65de2977205c403bbc107264b8eccf4b/Cloud/en-US/c103fb414988447ead2023f768096dcc.html)
- mainfest.yml (for help check https://help.sap.com/viewer/65de2977205c403bbc107264b8eccf4b/Cloud/en-US/ba527058dc4d423a9e0a69ecc67f4593.html)`
    );
  }
}
