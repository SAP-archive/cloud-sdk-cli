/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as execa from 'execa';

export default class GenerateVdm extends Command {
  static description =
    'Generates a virtual data model (VDM) from a edmx service file definition. For SAP solution you can find these definitions on https://api.sap.com/';

  static examples = ['$ sap-cloud-sdk generate-vdm', '$ sap-cloud-sdk generate-vdm --help'];

  static flags = {
    inputDir: flags.string({
      description: 'Folder containing the service definitions.',
      required: true,
      char: 'i',
      name: 'inputDir'
    }),
    outputDir: flags.string({
      description: 'Folder to which the vdm is written',
      required: true,
      char: 'o',
      name: 'outputDir'
    }),
    force: flags.boolean({
      hidden: true,
      description: 'Does everything without asking questions.'
    }),
    projectDir: flags.string({
      default: '.',
      description: 'Path to the folder in which the VDM should be created. The input and output dir are relative to this directory.'
    })
  };

  async run() {
    const { flags } = this.parse(GenerateVdm);

    if (!(await this.isSKDgeneratorInstalled())) {
      const installGenerator =
        flags.force ||
        (await cli.confirm('The @sap/cloud-sdk-generator is needed to generate VDM and it is not installed yet. Do you want to install it?'));
      if (installGenerator) {
        cli.action.start('Installing @sap/cloud-sdk-generator.');
        await execa('npm', ['i', '@sap/cloud-sdk-generator', '--devSave'], { cwd: flags.projectDir });
        cli.action.stop();
      } else {
        return;
      }
    }
    await execa('npx', ['generate-odata-client', '-i', flags.inputDir, '-o', flags.outputDir], { cwd: flags.projectDir });
  }

  private async isSKDgeneratorInstalled(): Promise<boolean> {
    return execa('npm', ['info', '@sap/cloud-sdk-generator'])
      .then(() => true)
      .catch(() => false);
  }
}
