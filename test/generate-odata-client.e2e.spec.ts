/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
import { deleteAsync } from './test-utils';

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

  beforeAll(async () => {
    await deleteAsync(pathForTests, 6);
    const pathForResources = path.resolve(__dirname, 'resources', 'template-generator-odata-client');
    await fs.copy(pathForResources, pathForTests);
  }, 80000);

  afterAll(async () => {
    await deleteAsync(pathForTests, 6);
  }, 80000);

  test('[E2E] should generate a OData client', async () => {
    const result = await GenerateODataClient.run(['-i', 'edmxSource', '-o', 'output', '--projectDir', pathForTests]);
    expect(result.exitCode).toBe(0);

    expect(await fs.readdir(path.resolve(pathForTests, 'output'))).toHaveLength(1);
  }, 120000);
});
