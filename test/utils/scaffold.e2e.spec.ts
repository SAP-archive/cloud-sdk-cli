/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */

import { buildScaffold, rm } from '../../src/utils';
import {
  getCleanProjectDir,
  getTestOutputDir,
  TimeThresholds
} from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Scaffold Utils', () => {
  beforeAll(async () => {
    await rm(testOutputDir);
  }, TimeThresholds.LONG);

  it(
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
