/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
const confirm = jest.fn().mockResolvedValue(true);
jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      confirm
    }
  };
});

const warn = jest.fn(message => console.log('MOCKED WARNING: ', message));
jest.mock('@oclif/command', () => {
  const command = jest.requireActual('@oclif/command');
  command.Command.prototype.warn = warn;
  return command;
});

import * as fs from 'fs-extra';
import * as path from 'path';
import GenerateVdm from '../src/commands/generate-vdm';

describe('generate-vdm', () => {
  const pathForTests = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

  beforeAll(() => {
    const pathForResources = path.resolve(__dirname, 'resources', 'template-generator-vdm');
    fs.copySync(pathForResources, pathForTests);
  });

  afterAll(() => {
    fs.removeSync(pathForTests);
  });

  it('should generate a vdm.', async () => {
    await GenerateVdm.run(['-i', 'edmxSource', '-o', 'generatedVdm', '--force', '--projectDir', pathForTests]);
    const files = fs.readdirSync(path.join(pathForTests, 'generatedVdm', 'business-partner-service'));
    expect(files.length).toBeGreaterThan(0);
  }, 60000);
});
