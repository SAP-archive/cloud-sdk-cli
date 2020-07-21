/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

jest.mock('../src/utils/message-formatter');

import * as fs from 'fs-extra';
import * as path from 'path';
import * as rm from 'rimraf';
import Package from '../src/commands/package';
import { boxMessage } from '../src/utils';
import { getCleanProjectDir, getTestOutputDir } from './test-utils';

const testOutputDir = getTestOutputDir(__filename);
const nestAppDir = path.resolve('test', 'nest');

jest.retryTimes(3);

describe('Package', () => {
  beforeAll(() => {
    rm.sync(testOutputDir);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    rm.sync(testOutputDir);
  });

  it('should copy files correctly without parameters', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'no-params');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir]);

    const copiedFiles = fs.readdirSync(path.resolve(projectDir, 'deployment'));
    expect(copiedFiles).toIncludeAllMembers(['package.json', 'package-lock.json']);
    expect(copiedFiles).toHaveLength(2);
  }, 10000);

  it('should copy files correctly with custom globs', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'globs');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--include=*.json', '--exclude=package*,tsconfig*']);

    expect(fs.readdirSync(path.resolve(projectDir, 'deployment'))).toIncludeAllMembers(['nest-cli.json']);
    expect(fs.readdirSync(path.resolve(projectDir, 'deployment'))).not.toIncludeAnyMembers(['package.json', 'package-lock.json', 'tsconfig.json']);
  });

  it('should overwrite output folder', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'folder-overwrite');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--include=.gitignore']);
    await Package.run([projectDir, '--include=README.md']);

    expect(fs.readdirSync(path.resolve(projectDir, 'deployment'))).toEqual(['README.md']);
  });

  test('[E2E] should copy dependencies when --ci is set', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'productive-dependencies');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--ci']);

    expect(fs.readdirSync(path.resolve(projectDir, 'deployment'))).toIncludeAllMembers(['package.json', 'package-lock.json', 'node_modules']);
  }, 60000);

  it('should not show warning messages when old dependencies are not used', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'without-dependencies');
    fs.copySync(nestAppDir, projectDir, { recursive: true });

    await Package.run([projectDir]);

    expect(boxMessage).toBeCalledWith(expect.arrayContaining(['✅ Package finished successfully.']));
    expect(boxMessage).not.toBeCalledWith(
      expect.arrayContaining(['- Old SAP Cloud SDK: @sap/cloud-sdk-core is detected.', 'Please find how to migrate here:'])
    );
  });

  it('should show warning messages when old dependencies are used', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'old-dependencies');
    fs.copySync(nestAppDir, projectDir, { recursive: true });

    const packageJson = JSON.parse(fs.readFileSync(path.resolve(projectDir, 'package.json'), { encoding: 'utf8' }));
    packageJson.dependencies['@sap/cloud-sdk-core'] = '^1.17.2';
    fs.writeFileSync(path.resolve(projectDir, 'package.json'), JSON.stringify(packageJson), { encoding: 'utf8' });

    await Package.run([projectDir]);

    expect(boxMessage).toBeCalledWith(
      expect.arrayContaining(['- Old SAP Cloud SDK: @sap/cloud-sdk-core is detected.', 'Please find how to migrate here:'])
    );
    expect(boxMessage).not.toBeCalledWith(expect.arrayContaining(['✅ Package finished successfully.']));
  });
});
