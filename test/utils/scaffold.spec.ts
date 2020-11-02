/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */
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
jest.retryTimes(3);

import * as path from 'path';
import * as fs from 'fs-extra';
import { shouldBuildScaffold } from '../../src/utils';
import {
  deleteAsync,
  getCleanProjectDir,
  getTestOutputDir,
  TimeThresholds
} from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Scaffold Utils', () => {
  beforeAll(async () => {
    await deleteAsync(testOutputDir, 6);
  }, TimeThresholds.LONG);

  it(
    'should determine if scaffold is needed',
    async () => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'should-build-scaffold'
      );

      expect(await shouldBuildScaffold(projectDir, false)).toBe(true);
      expect(await shouldBuildScaffold(projectDir, true)).toBe(true);

      const packageJsonPath = path.resolve(projectDir, 'package.json');
      await fs.copyFile(
        path.resolve('test', 'nest', 'package.json'),
        packageJsonPath
      );
      expect(await shouldBuildScaffold(projectDir, false)).toBe(false);
    },
    TimeThresholds.SHORT
  );
});
