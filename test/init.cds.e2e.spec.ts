/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

jest.mock('../src/utils/warnings');

import execa = require('execa');
import * as fs from 'fs-extra';
import * as path from 'path';
import Init from '../src/commands/init';
import { deleteAsync, getCleanProjectDir, getTestOutputDir } from './test-utils';

const testOutputDir = getTestOutputDir(__filename);

jest.retryTimes(3);

describe('Init', () => {
  beforeAll(async () => {
    return deleteAsync(testOutputDir, 6);
  }, 120000);

  afterAll(async () => {
    return deleteAsync(testOutputDir, 6);
  }, 120000);

  test('[E2E] should create a new project with the necessary files when adding cds', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'full-init-cds');
    await Init.run([projectDir, '--projectName=testingApp', '--buildScaffold', '--no-analytics', '--addCds']);

    ['.cdsrc.json', 'srv/cat-service.cds', 'db/data-model.cds', 'src/catalogue/catalogue.module.ts']
      .map(file => path.resolve(projectDir, file))
      .forEach(path => {
        expect(fs.existsSync(path)).toBe(true);
      });

    await execa('npm', ['run', 'cds-deploy'], { cwd: projectDir, stdio: 'inherit' });
    expect(fs.existsSync(path.resolve(projectDir, 'testingApp.db'))).toBeTrue();
  }, 240000);
});
