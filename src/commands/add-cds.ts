/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as Listr from 'listr';
import { copyFiles, findConflicts, getCopyDescriptors, getTemplatePaths } from '../utils/templates';

export default class AddCds extends Command {
  static description = 'Setup your Cloud Foundry app to use a CDS service';
  static aliases = ['add-cap'];
  static examples = ['$ sap-cloud-sdk add-cds'];

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
    const { flags } = this.parse(AddCds);
    try {
      const options = await this.getOptions();
      const tasks = new Listr([
        {
          title: 'Creating files',
          task: () => {
            const copyDescriptors = getCopyDescriptors(flags.projectDir, getTemplatePaths(['add-cds']));
            findConflicts(copyDescriptors, flags.force);
            copyFiles(copyDescriptors, options);
          }
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
      `✅ Successfully added a cds service to your project.

Generated service needs to be exposed.
For express apps you can do this by adding the following snippet to your code:
  cds
    .connect()
    .serve('CatalogService')
    .in(<your-express-app>)
For other frameworks please refer to the documentation.
`
    );
  }
}
