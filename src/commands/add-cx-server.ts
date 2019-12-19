/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import { OutputFlags } from '@oclif/parser';
import * as Listr from 'listr';
import * as path from 'path';
import { CopyDescriptor, copyFiles, findConflicts } from '../utils/';

type Flags = OutputFlags<typeof AddCxServer.flags>;

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
      description: 'Do not fail if a file already exist and overwrite it.'
    }),
    platform: flags.string({
      hidden: true,
      default: process.platform,
      description: 'The currently running OS.'
    }),
    help: flags.help({
      char: 'h',
      description: 'Show help for the add-cx-server command.'
    })
  };

  async run() {
    const { flags } = this.parse(AddCxServer);
    const options = await this.getOptions();

    try {
      const files = [this.copyDescriptorForGithub('cx-server', flags), this.copyDescriptorForGithub('server.cfg', flags)];
      if (flags.platform === 'win32') {
        files.push(this.copyDescriptorForGithub('cx-server.bat', flags));
      }

      const tasks = new Listr([
        {
          title: 'Finding potential conflicts',
          task: () => findConflicts(files, flags.force)
        },
        {
          title: 'Creating files',
          task: () => copyFiles(files, options)
        }
      ]);

      await tasks.run();
    } catch (error) {
      this.error(error, { exit: 1 });
    }
  }

  private copyDescriptorForGithub(fileName: string, flags: Flags): CopyDescriptor {
    const githubPrefix = 'https://raw.githubusercontent.com/SAP/devops-docker-cx-server/master/cx-server-companion/life-cycle-scripts/';

    return {
      sourcePath: new URL(fileName, githubPrefix),
      fileName: path.resolve(flags.projectDir, 'cx-server', fileName)
    };
  }

  private async getOptions() {
    return {};
  }
}
