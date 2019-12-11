/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command } from '@oclif/command';

export class DummyCommand extends Command {
  async run() {
    this.log('in run dummy command');
    return Promise.resolve();
  }
}
