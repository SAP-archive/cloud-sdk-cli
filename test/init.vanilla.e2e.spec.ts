/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */
jest.mock('../src/utils/warnings');

import * as path from 'path';
import execa = require('execa');
import Init from '../src/commands/init';
import { readdir, rm, readFile, access } from '../src/utils';
import {
  getCleanProjectDir,
  getTestOutputDir,
  TimeThresholds
} from './test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Init', () => {
  beforeAll(async () => {
    await rm(testOutputDir);
  }, TimeThresholds.EXTRA_LONG);

  it(
    '[E2E] should create a new project with the necessary files',
    async () => {
      const projectDir = await getCleanProjectDir(testOutputDir, 'full-init');
      await Init.run([
        projectDir,
        '--projectName=testingApp',
        '--buildScaffold',
        '--no-analytics'
      ]);

      await Promise.all([
        ...['credentials.json', 'systems.json', 'manifest.yml'].map(file =>
          access(path.resolve(projectDir, file))
        ),
        readFile(path.resolve(projectDir, 'README.md'), {
          encoding: 'utf8'
        }).then(file => expect(file).toInclude('SAP Cloud SDK'))
      ]);

      // execute the ci scripts and check if the reports are written
      // trying to do this in parallel lead to strange npm errors
      await execa('npm', ['run', 'ci-backend-unit-test'], {
        cwd: projectDir,
        stdio: 'inherit'
      });
      await execa('npm', ['run', 'ci-it-backend'], {
        cwd: projectDir,
        stdio: 'inherit'
      });

      const r = path.resolve(projectDir, 's4hana_pipeline', 'reports');
      const backendUnit = path.resolve(r, 'backend-unit');
      const backendUnitCoverage = path.resolve(
        r,
        'coverage-reports',
        'backend-unit'
      );
      const backendIntegration = path.resolve(r, 'backend-integration');

      return Promise.all([
        readdir(backendUnit),
        readdir(backendUnitCoverage),
        readdir(backendIntegration)
      ]).then(folders => {
        folders.forEach(folder => expect(folder.length).toBeGreaterThan(1));
        return Promise.resolve();
      });
    },
    TimeThresholds.EXTRA_LONG
  );
});
