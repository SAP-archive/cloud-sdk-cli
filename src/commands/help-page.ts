/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';

export default class HelpPage extends Command {
  static description = 'Open the product page, which contains tutorials and links to all relevant resources';

  static flags = {
    help: flags.help({ char: 'h' })
  };

  async run() {
    this.log('Visit us at: ');
    cli.url('https://developers.sap.com/topics/cloud-sdk.html', 'https://developers.sap.com/topics/cloud-sdk.html');
    cli.open('https://developers.sap.com/topics/cloud-sdk.html');
  }
}
