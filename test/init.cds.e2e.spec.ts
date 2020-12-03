/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */

jest.mock('../src/utils/warnings');

import * as path from 'path';
import execa = require('execa');
import Init from '../src/commands/init';
import { access, rm } from '../src/utils';
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
    '[E2E] should create a new project with the necessary files when adding cds',
    async () => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'full-init-cds'
      );
      await Init.run([
        projectDir,
        '--projectName=testingApp',
        '--buildScaffold',
        '--no-analytics',
        '--addCds'
      ]);

      await Promise.all(
        [
          '.cdsrc.json',
          'srv/cat-service.cds',
          'db/data-model.cds',
          'src/catalogue/catalogue.module.ts'
        ].map(file =>
          expect(access(path.resolve(projectDir, file))).toResolve()
        )
      );

      await execa('npm', ['run', 'cds-deploy'], {
        cwd: projectDir,
        stdio: 'inherit'
      });
      await expect(
        access(path.resolve(projectDir, 'testingApp.db'))
      ).toResolve();
    },
    TimeThresholds.EXTRA_LONG
  );
});
