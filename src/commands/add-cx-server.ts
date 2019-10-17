/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as path from 'path';
import { copyFiles, findConflicts, readTemplates } from '../utils/templates';

export default class AddCxServer extends Command {
  static description = 'Add the scripts to set up a Jenkins master for CI/CD of your project';
  static examples = ['$ sap-cloud-sdk add-cx-server'];

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
    const { flags } = this.parse(AddCxServer);
    const options = await this.getOptions();

    try {
      cli.action.start('Reading templates');
      const files = readTemplates({from: [path.resolve(__dirname, '..', 'templates', 'add-cx-server')], to: flags.projectDir});
      cli.action.stop();

      cli.action.start('Finding potential conflicts');
      await findConflicts(files, flags.force, this.error);
      cli.action.stop();

      cli.action.start('Creating files');
      copyFiles(files, options, this.error);
      cli.action.stop();
    } catch (error) {
      this.error(error, { exit: 1 });
    }
  }

  private getOptions() {
    return {};
  }
}
