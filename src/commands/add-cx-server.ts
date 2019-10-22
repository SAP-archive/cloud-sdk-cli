/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as path from 'path';
import { copyFiles, findConflicts } from '../utils/templates';

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
      const githubPrefix = 'https://raw.githubusercontent.com/SAP/devops-docker-cx-server/master/cx-server-companion/life-cycle-scripts/';
      const files = [
        {
          sourcePath: new URL('cx-server', githubPrefix),
          targetFolder: path.resolve(flags.projectDir, 'cx-server'),
          fileName: path.resolve(flags.projectDir, 'cx-server', 'cx-server')
        },
        {
          sourcePath: new URL('server.cfg', githubPrefix),
          targetFolder: path.resolve(flags.projectDir, 'cx-server'),
          fileName: path.resolve(flags.projectDir, 'cx-server', 'server.cfg')
        }
      ];

      cli.action.start('Finding potential conflicts');
      await findConflicts(files, flags.force, this.error);
      cli.action.stop();

      cli.action.start('Creating files');
      await copyFiles(files, options).catch(e => this.error(e, { exit: 2 }));
      cli.action.stop();
    } catch (error) {
      this.error(error, { exit: 1 });
    }
  }

  private getOptions() {
    return {};
  }
}
