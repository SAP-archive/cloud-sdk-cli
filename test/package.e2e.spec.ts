/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */

jest.mock('../src/utils/message-formatter');

import * as path from 'path';
import * as fs from 'fs-extra';
import Package from '../src/commands/package';
import {
  deleteAsync,
  getCleanProjectDir,
  getTestOutputDir,
  TimeThresholds
} from './test-utils';

const testOutputDir = getTestOutputDir(__filename);
const nestAppDir = path.resolve('test', 'nest');

describe('Package', () => {
  beforeAll(async () => {
    await deleteAsync(testOutputDir, 3);
  }, TimeThresholds.SHORT);

  beforeEach(() => {
    jest.clearAllMocks();
  }, TimeThresholds.SHORT);

  it(
    '[E2E] should copy dependencies when --ci is set',
    async () => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'productive-dependencies'
      );
      await fs.copy(nestAppDir, projectDir, { recursive: true });
      await Package.run([projectDir, '--ci']);

      return fs
        .readdir(path.resolve(projectDir, 'deployment'))
        .then(files =>
          expect(files).toIncludeAllMembers([
            'package.json',
            'package-lock.json',
            'node_modules'
          ])
        );
    },
    TimeThresholds.LONG
  );
});
