/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */
jest.retryTimes(3);

import { buildScaffold } from '../../src/utils';
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

  test(
    '[E2E] should build the scaffold',
    async () => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'build-scaffold'
      );

      await buildScaffold(projectDir, false, false);
    },
    TimeThresholds.LONG
  );
});
