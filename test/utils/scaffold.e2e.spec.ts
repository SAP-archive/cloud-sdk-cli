/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jest.retryTimes(3);

import * as fs from 'fs';
import * as path from 'path';
import { buildScaffold, shouldBuildScaffold } from '../../src/utils';
import { deleteAsync, getCleanProjectDir, getTestOutputDir } from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Scaffold Utils', () => {
  beforeAll(async () => {
    return deleteAsync(testOutputDir, 6);
  }, 80000);

  afterAll(async () => {
    return deleteAsync(testOutputDir, 6);
  }, 80000);

  test('[E2E] should build the scaffold', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'build-scaffold');

    await buildScaffold(projectDir, false, false);

    expect(fs.readdirSync(projectDir).sort()).toMatchSnapshot();
  }, 80000);
});
