/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

jest.mock('../src/utils/message-formatter');

import * as fs from 'fs-extra';
import * as path from 'path';
import Package from '../src/commands/package';
import { boxMessage } from '../src/utils';
import { deleteAsync, getCleanProjectDir, getTestOutputDir } from './test-utils';

const testOutputDir = getTestOutputDir(__filename);
const nestAppDir = path.resolve('test', 'nest');

jest.retryTimes(3);

describe('Package', () => {
  beforeAll(async () => {
    await deleteAsync(testOutputDir, 3);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await deleteAsync(testOutputDir, 3);
  });

  it('should copy files correctly without parameters', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'no-params');
    await fs.copy(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir]);

    const copiedFiles = await fs.readdir(path.resolve(projectDir, 'deployment'));
    expect(copiedFiles).toIncludeAllMembers(['package.json', 'package-lock.json']);
    expect(copiedFiles).toHaveLength(2);
  }, 10000);

  it('should copy files correctly with custom globs', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'globs');
    await fs.copy(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--include=*.json', '--exclude=package*,tsconfig*']);

    const files = await fs.readdir(path.resolve(projectDir, 'deployment'));
    expect(files).toIncludeAllMembers(['nest-cli.json']);
    expect(files).not.toIncludeAnyMembers(['package.json', 'package-lock.json', 'tsconfig.json']);
  });

  it('should overwrite output folder', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'folder-overwrite');
    await fs.copy(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--include=.gitignore']);
    await Package.run([projectDir, '--include=README.md']);

    return fs.readdir(path.resolve(projectDir, 'deployment')).then(files => expect(files).toEqual(['README.md']));
  });

  test('[E2E] should copy dependencies when --ci is set', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'productive-dependencies');
    await fs.copy(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--ci']);

    return fs
      .readdir(path.resolve(projectDir, 'deployment'))
      .then(files => expect(files).toIncludeAllMembers(['package.json', 'package-lock.json', 'node_modules']));
  }, 60000);

  it('should not show warning messages when old dependencies are not used', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'without-dependencies');
    await fs.copy(nestAppDir, projectDir, { recursive: true });

    await Package.run([projectDir]);

    expect(boxMessage).toBeCalledWith(expect.arrayContaining(['✅ Package finished successfully.']));
    expect(boxMessage).not.toBeCalledWith(
      expect.arrayContaining(['- Old SAP Cloud SDK: @sap/cloud-sdk-core is detected.', 'Please find how to migrate here:'])
    );
  });

  it('should show warning messages when old dependencies are used', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'old-dependencies');
    await fs.copy(nestAppDir, projectDir, { recursive: true });

    const packageJson = await fs.readFile(path.resolve(projectDir, 'package.json'), { encoding: 'utf8' }).then(file => JSON.parse(file));
    packageJson.dependencies['@sap/cloud-sdk-core'] = '^1.17.2';
    await fs.writeFile(path.resolve(projectDir, 'package.json'), JSON.stringify(packageJson), { encoding: 'utf8' });

    await Package.run([projectDir]);

    expect(boxMessage).toBeCalledWith(
      expect.arrayContaining(['- Old SAP Cloud SDK: @sap/cloud-sdk-core is detected.', 'Please find how to migrate here:'])
    );
    expect(boxMessage).not.toBeCalledWith(expect.arrayContaining(['✅ Package finished successfully.']));
  });
});
