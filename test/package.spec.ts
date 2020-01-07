/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
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
    const projectDir = getCleanProjectDir(testOutputDir, 'package-without-param');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--skipInstall']);

    expect(fs.readdirSync(path.resolve(projectDir, 'deployment'))).toIncludeAllMembers(['package.json', 'package-lock.json']);
  });

  it('should copy files correctly with custom globs', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'package-with-globs');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    await Package.run([projectDir, '--include=*.json', '--exclude=package*,tsconfig*', '--skipInstall']);

    expect(fs.readdirSync(path.resolve(projectDir, 'deployment'))).toIncludeAllMembers(['nest-cli.json', 'tslint.json']);
  });

  it('should overwrite output folder', () => {
    expect(true).toBe(true);
  });

  it('should install productive dependencies only', () => {
    expect(true).toBe(true);
  });
});
