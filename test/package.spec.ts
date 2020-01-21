/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import Package from '../src/commands/package';
import { getCleanProjectDir, getTestOutputDir } from './test-utils';

const testOutputDir = getTestOutputDir(__filename);
const nestAppDir = path.resolve('test', 'nest');

describe('Package', () => {
  afterAll(() => {
    fs.removeSync(testOutputDir);
  });

  it('should copy files correctly without parameters', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'no-params');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--skipInstall']);

    const copiedFiles = fs.readdirSync(path.resolve(projectDir, 'deployment'));
    expect(copiedFiles).toIncludeAllMembers(['package.json', 'package-lock.json']);
    expect(copiedFiles).toHaveLength(2);
  });

  it('should copy files correctly with custom globs', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'globs');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--include=*.json', '--exclude=package*,tsconfig*', '--skipInstall']);

    expect(fs.readdirSync(path.resolve(projectDir, 'deployment'))).toIncludeAllMembers(['nest-cli.json', 'tslint.json']);
    expect(fs.readdirSync(path.resolve(projectDir, 'deployment'))).not.toIncludeAnyMembers(['package.json', 'package-lock.json', 'tsconfig.json']);
  });

  it('should overwrite output folder', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'folder-overwrite');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--include=.gitignore', '--skipInstall']);
    await Package.run([projectDir, '--include=README.md', '--skipInstall']);

    expect(fs.readdirSync(path.resolve(projectDir, 'deployment'))).toEqual(['README.md']);
  });

  it('[E2E] should install productive dependencies only', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'productive-dependencies');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir]);

    expect(fs.readdirSync(path.resolve(projectDir, 'deployment'))).toIncludeAllMembers(['package.json', 'package-lock.json', 'node_modules']);
    expect(fs.readdirSync(path.resolve(projectDir, 'deployment', 'node_modules', '@nestjs'))).not.toContain('cli');
  }, 60000);
});
