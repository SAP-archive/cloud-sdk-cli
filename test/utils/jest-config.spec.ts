/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */
import * as path from 'path';
import * as fs from 'fs-extra';
import {
  unitTestConfig,
  integrationTestConfig,
  modifyJestConfig,
  rm
} from '../../src/utils';
import {
  getCleanProjectDir,
  getTestOutputDir,
  TimeThresholds
} from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Jest Config Utils', () => {
  beforeAll(async () => {
    await rm(testOutputDir);
  }, TimeThresholds.EXTRA_SHORT);

  it(
    'returns jest config object for unit tests',
    () => {
      expect(unitTestConfig).toMatchSnapshot();
    },
    TimeThresholds.EXTRA_SHORT
  );

  it(
    'returns jest config object for integration tests',
    () => {
      expect(integrationTestConfig).toMatchSnapshot();
    },
    TimeThresholds.EXTRA_SHORT
  );

  it(
    'returns adds jest config to file',
    async () => {
      const projectDir = await getCleanProjectDir(testOutputDir, 'jest-config');
      const jestConfigPath = path.resolve(projectDir, 'jest-e2e.json');
      await fs.copyFile(
        path.resolve('test', 'nest', 'test', 'jest-e2e.json'),
        jestConfigPath
      );

      await modifyJestConfig(jestConfigPath, integrationTestConfig);

      expect(
        JSON.parse(await fs.readFile(jestConfigPath, { encoding: 'utf8' }))
      ).toMatchObject(integrationTestConfig);
    },
    TimeThresholds.EXTRA_SHORT
  );
});
