/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
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
      hidden: true,
      description: 'Overwrite files without asking if conflicts are found.'
    }),
    help: flags.help({ char: 'h' })
  };

  async run() {
    const { flags } = this.parse(AddApprouter);
    try {
      cli.action.start('Reading templates');
      const files = readTemplates([path.resolve(__dirname, '..', 'templates', 'add-approuter')], flags.projectDir);
      cli.action.stop();

      cli.action.start('Finding potential conflicts');
      await findConflicts(files, flags.force, this.error);
      cli.action.stop();

      cli.action.start('Creating files');
      copyFiles(files, await this.getOptions(), this.error);
      cli.action.stop();

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
      this.log(error);
    }

    const options: { [key: string]: string } = {
      projectName: projectName || (await cli.prompt('Enter project name as maintained in Cloud Foundry'))
    };

    return options;
  }

  private printSuccessMessage() {
    this.log('✅ Successfully added approuter.');
    this.log('');
    this.log('⚠️ Please verify these generated files:');
    this.log(
      '- xs-security.json (for help check https://help.sap.com/viewer/4505d0bdaf4948449b7f7379d24d0f0d/2.0.02/en-US/e6fc90df44464a29952e1c2c36dd9861.html)'
    );
    this.log(
      '- xs-app.json (for help check https://help.sap.com/viewer/65de2977205c403bbc107264b8eccf4b/Cloud/en-US/c103fb414988447ead2023f768096dcc.html)'
    );
    this.log(
      '- mainfest.yml (for help check https://help.sap.com/viewer/65de2977205c403bbc107264b8eccf4b/Cloud/en-US/ba527058dc4d423a9e0a69ecc67f4593.html)'
    );
  }
}
