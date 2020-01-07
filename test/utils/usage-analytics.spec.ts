/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
const confirm = jest.fn().mockResolvedValue(false);

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

import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { usageAnalytics } from '../../src/utils';
import { getCleanProjectDir, getTestOutputDir } from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

function readConsentFile(projectDir: string) {
  const filePath = path.resolve(projectDir, 'sap-cloud-sdk-analytics.json');
  return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
}

describe('Usage Analytics Utils', () => {
  afterAll(() => {
    rm.sync(testOutputDir);
  });

  it('Create usage analytics consent file', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'usage-analytics');

    await usageAnalytics(projectDir, true);
    expect(readConsentFile(projectDir).enabled).toBe(true);

    await usageAnalytics(projectDir, true, 'TEST');
    expect(readConsentFile(projectDir)).toEqual({ enabled: true, salt: 'TEST' });

    await usageAnalytics(projectDir, undefined);
    expect(readConsentFile(projectDir).enabled).toBe(false);

    await usageAnalytics(projectDir, false);
    expect(readConsentFile(projectDir).enabled).toBe(false);
  });
});
