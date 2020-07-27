/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

jest.mock('../src/utils/warnings');

import * as fs from 'fs-extra';
import * as path from 'path';
import Init from '../src/commands/init';
import { getWarnings, recordWarning } from '../src/utils/warnings';
import { deleteAsync, getCleanProjectDir, getTestOutputDir } from './test-utils';

const testOutputDir = getTestOutputDir(__filename);
const expressAppDir = path.resolve('test', 'express');
const nestAppDir = path.resolve('test', 'nest');

jest.retryTimes(3);

describe('Init', () => {
  beforeAll(async () => {
    await deleteAsync(testOutputDir, 6);
  }, 80000);

  afterAll(async () => {
    await deleteAsync(testOutputDir, 6);
  }, 80000);

  it('should add necessary files to an existing project', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'add-to-existing');
    await fs.copy(expressAppDir, projectDir, { recursive: true });

    await Init.run([projectDir, '--projectName=testingApp', '--startCommand="npm start"', '--no-analytics', '--skipInstall', '--force']);

    await Promise.all(
      ['.npmrc', 'credentials.json', 'systems.json', 'manifest.yml'].map(file => path.resolve(projectDir, file)).map(path => fs.access(path))
    );
    try {
      await fs.access(path.resolve(projectDir, 'test'));
    } catch (e) {
      expect(e.message).toMatch(/no such file or directory.*test/);
    }
  }, 10000);

  it('should add necessary files to an existing project when adding cds', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'add-to-existing');
    await fs.copy(expressAppDir, projectDir, { recursive: true });

    await Init.run([projectDir, '--projectName=testingApp', '--addCds', '--startCommand="npm start"', '--no-analytics', '--skipInstall', '--force']);

    return Promise.all(
      ['.cdsrc.json', 'srv/cat-service.cds', 'db/data-model.cds'].map(file => path.resolve(projectDir, file)).map(path => fs.access(path))
    );
  }, 10000);

  it('init should detect and fail if there are conflicts', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'detect-conflicts');
    await fs.copy(nestAppDir, projectDir, { recursive: true });
    await fs.createFile(`${projectDir}/.npmrc`);

    try {
      await Init.run([projectDir, '--projectName=testingApp', '--startCommand="npm start"', '--skipInstall', '--no-analytics']);
    } catch (e) {
      expect(e.message).toMatch(/A file with the name .* already exists\./);
    }
  }, 10000);

  it('should add to .gitignore if there is one', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'add-to-gitignore');
    await fs.copy(nestAppDir, projectDir, { recursive: true });

    await Init.run([projectDir, '--projectName=testingApp', '--startCommand="npm start"', '--skipInstall', '--no-analytics']);

    const gitignoreEntries = (await fs.readFile(`${projectDir}/.gitignore`, 'utf8')).split('\n').filter(entry => entry !== '');

    expect(gitignoreEntries).toIncludeAllMembers(['credentials.json', '/s4hana_pipeline', '/deployment']);
    expect(gitignoreEntries.length).toBeGreaterThan(29);
  }, 10000);

  it('should show a warning if the project is not using git', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'warn-on-no-git');

    await fs.createFile(path.resolve(projectDir, 'package.json'));
    await fs.writeFile(path.resolve(projectDir, 'package.json'), JSON.stringify({ name: 'project' }), 'utf8');

    await Init.run([projectDir, '--projectName=testingApp', '--startCommand="npm start"', '--skipInstall', '--no-analytics']);

    expect(recordWarning).toHaveBeenCalledWith(
      'No .gitignore file found!',
      'If your project is using a different version control system,',
      'please make sure the following paths are not tracked:',
      '  credentials.json',
      '  /s4hana_pipeline',
      '  /deployment'
    );
    expect(getWarnings).toHaveBeenCalled();
  }, 10000);

  it('should add our scripts and dependencies to the package.json', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'add-scripts-and-dependencies');
    await fs.createFile(path.resolve(projectDir, 'package.json'));
    await fs.writeFile(path.resolve(projectDir, 'package.json'), JSON.stringify({ name: 'project' }), 'utf8');

    await Init.run([projectDir, '--projectName=testingApp', '--startCommand="npm start"', '--frontendScripts', '--skipInstall', '--no-analytics']);

    return fs.readFile(path.resolve(projectDir, 'package.json'), 'utf8').then(value => {
      const packageJson = JSON.parse(value);

      const dependencies = Object.keys(packageJson.dependencies);
      const devDependencies = Object.keys(packageJson.devDependencies);
      const scripts = Object.keys(packageJson.scripts);

      expect(dependencies).toContain('@sap-cloud-sdk/core');
      expect(devDependencies).toContain('@sap-cloud-sdk/test-util');
      expect(scripts).toIncludeAllMembers([
        'ci-build',
        'ci-package',
        'ci-backend-unit-test',
        'ci-frontend-unit-test',
        'ci-integration-test',
        'ci-e2e'
      ]);
    });
  }, 10000);

  it('should add the analytics file', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'add-to-gitignore');
    await fs.copy(nestAppDir, projectDir, { recursive: true });

    await Init.run([
      projectDir,
      '--projectName=testingApp',
      '--startCommand="npm start"',
      '--skipInstall',
      '--analytics',
      '--analyticsSalt=SAPCLOUDSDK4LIFE'
    ]);

    expect(JSON.parse(await fs.readFile(`${projectDir}/sap-cloud-sdk-analytics.json`, 'utf8'))).toEqual({ enabled: true, salt: 'SAPCLOUDSDK4LIFE' });
  }, 10000);

  it('should add a disabled analytics file', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'add-to-gitignore');
    await fs.copy(expressAppDir, projectDir, { recursive: true });

    await Init.run([projectDir, '--projectName=testingApp', '--startCommand="npm start"', '--skipInstall', '--no-analytics']);

    return fs.readFile(`${projectDir}/sap-cloud-sdk-analytics.json`, 'utf8').then(file => expect(JSON.parse(file)).toEqual({ enabled: false }));
  }, 10000);
});
