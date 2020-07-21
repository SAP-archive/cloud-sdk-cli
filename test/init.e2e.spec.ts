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
  }, 80000);

  afterAll(async () => {
    await deleteAsync(testOutputDir, 6);
  }, 80000);

  test('[E2E] should create a new project with the necessary files', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'full-init');
    await Init.run([projectDir, '--projectName=testingApp', '--buildScaffold', '--no-analytics']);

    ['.npmrc', 'credentials.json', 'systems.json', 'manifest.yml']
      .map(file => path.resolve(projectDir, file))
      .forEach(path => {
        expect(fs.existsSync(path)).toBe(true);
      });

    const reportsPath = path.resolve(projectDir, 's4hana_pipeline', 'reports');
    expect(fs.readFileSync(path.resolve(projectDir, 'README.md'), { encoding: 'utf8' })).toInclude('SAP Cloud SDK');

    // execute the ci scripts and check if the reports are written
    await execa('npm', ['run', 'ci-backend-unit-test'], { cwd: projectDir, stdio: 'inherit' });
    expect(fs.readdirSync(path.resolve(reportsPath, 'backend-unit')).length).toBeGreaterThan(1);
    expect(fs.readdirSync(path.resolve(reportsPath, 'coverage-reports', 'backend-unit')).length).toBeGreaterThan(1);

    await execa('npm', ['run', 'ci-integration-test'], { cwd: projectDir, stdio: 'inherit' });
    expect(fs.readdirSync(path.resolve(reportsPath, 'backend-integration')).length).toBeGreaterThan(1);
    expect(fs.readdirSync(path.resolve(reportsPath, 'coverage-reports', 'backend-integration')).length).toBeGreaterThan(1);
  }, 240000);

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
