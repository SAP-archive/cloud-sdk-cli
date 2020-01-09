/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command } from '@oclif/command';
import cli from 'cli-ux';

export default class HelpPage extends Command {
  static description = 'Display the product page, which contains tutorials and links to all relevant resources';

  async run() {
    this.log('Visit us at:');
    this.log('  https://community.sap.com/topics/cloud-sdk');
    this.log('  https://developers.sap.com/topics/cloud-sdk.html');

    await cli.open('https://community.sap.com/topics/cloud-sdk');
  }
}
