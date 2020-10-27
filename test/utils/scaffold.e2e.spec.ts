/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */
jest.retryTimes(3);

import * as fs from 'fs-extra';
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
    async done => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'build-scaffold'
      );

      await buildScaffold(projectDir, false, false);

      const files = await fs.readdir(projectDir);
      expect(files.sort()).toMatchSnapshot();
      await fs.remove(
        `${testOutputDir}/build-scaffold/src/app.controller.spec.ts`
      );
      done();
    },
    TimeThresholds.LONG
  );
});
