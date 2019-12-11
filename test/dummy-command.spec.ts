/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import * as execa from 'execa';
import { DummyCommand } from '../src/commands/dummy-command';

describe('Test sigmentation error oclif', () => {
  it('test loop command 1 ', async () => {
    for (let i = 0; i < 10; i++) {
      console.log('In loog ' + i);
      await DummyCommand.run();
      await execa('sleep', ['2']);
    }
  }, 50000);
});
