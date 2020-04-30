/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jest.mock('cli-ux', () => ({
  default: {
    confirm: jest.fn().mockResolvedValue(true)
  }
}));
jest.retryTimes(3);

import * as fs from 'fs-extra';
import * as path from 'path';
import GenerateODataClient from '../src/commands/generate-odata-client';

describe('generate-odata-client', () => {
  const pathForTests = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

  beforeAll(() => {
    const pathForResources = path.resolve(__dirname, 'resources', 'template-generator-odata-client');
    fs.copySync(pathForResources, pathForTests);
  });

  afterAll(() => {
    fs.removeSync(pathForTests);
  });

  test('[E2E] should generate a OData client', async () => {
    expect(await GenerateODataClient.run(['-i', 'edmxSource', '-o', 'output', '--projectDir', pathForTests])).toResolve();

    expect(fs.readdirSync(path.resolve(pathForTests, 'output'))).toHaveLength(1);
  }, 120000);
});
