/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

jest.mock('../src/utils/warnings');

import execa = require('execa');
import * as fs from 'fs-extra';
import * as path from 'path';
import Init from '../src/commands/init';
import { deleteAsync, getCleanProjectDir, getTestOutputDir, TimeThresholds } from './test-utils';

const testOutputDir = getTestOutputDir(__filename);

jest.retryTimes(3);

describe('Init', () => {
  beforeAll(async () => {
    await deleteAsync(testOutputDir, 6);
  }, TimeThresholds.LONG);

  afterAll(async () => {
    await deleteAsync(testOutputDir, 6);
  }, TimeThresholds.LONG);

  test(
    '[E2E] should create a new project with the necessary files',
    async () => {
      const projectDir = await getCleanProjectDir(testOutputDir, 'full-init');
      await Init.run([projectDir, '--projectName=testingApp', '--buildScaffold', '--no-analytics']);

      await Promise.all([
        ...['.npmrc', 'credentials.json', 'systems.json', 'manifest.yml'].map(file => path.resolve(projectDir, file)).map(path => fs.access(path)),
        fs.readFile(path.resolve(projectDir, 'README.md'), { encoding: 'utf8' }).then(file => expect(file).toInclude('SAP Cloud SDK'))
      ]);

      // execute the ci scripts and check if the reports are written
      // trying to do this in parallel lead to strange npm errors
      await execa('npm', ['run', 'ci-backend-unit-test'], { cwd: projectDir, stdio: 'inherit' });
      await execa('npm', ['run', 'ci-integration-test'], { cwd: projectDir, stdio: 'inherit' });

      const reportsPath = path.resolve(projectDir, 's4hana_pipeline', 'reports');
      const backendUtil = fs.readdir(path.resolve(reportsPath, 'backend-unit'));
      const backendUtilCoverage = fs.readdir(path.resolve(reportsPath, 'coverage-reports', 'backend-unit'));
      const backendIntegration = fs.readdir(path.resolve(reportsPath, 'backend-integration'));

      return Promise.all([backendUtil, backendUtilCoverage, backendIntegration]).then(folders => {
        folders.forEach(folder => expect(folder.length).toBeGreaterThan(1));
        return Promise.resolve();
      });
    },
    TimeThresholds.EXTRAO_LONG
  );
});
