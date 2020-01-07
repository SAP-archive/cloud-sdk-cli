/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jest.mock('execa', () => jest.fn().mockResolvedValue('1.0.0'));

import * as execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { installDependencies, modifyPackageJson, parsePackageJson } from '../../src/utils';
import { getCleanProjectDir, getTestOutputDir } from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Package Json Utils', () => {
  afterAll(() => {
    rm.sync(testOutputDir);
  });

  it('should call `npm install`', () => {
    installDependencies('', true);
    expect(execa).toHaveBeenCalledWith('npm', ['install'], { cwd: '', stdio: 'inherit' });
  });

  it('should parse the package.json', () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'parse-package-json');
    const packageJsonPath = path.resolve(projectDir, 'package.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'package.json'), packageJsonPath);

    expect(Object.keys(parsePackageJson(projectDir)).sort()).toMatchSnapshot();
  });

  it('add scripts, dependencies and test config for existing project', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'modify-package-json-existing');
    const packageJsonPath = path.resolve(projectDir, 'package.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'package.json'), packageJsonPath);

    await modifyPackageJson({
      projectDir,
      isScaffold: false,
      frontendScripts: false,
      force: false,
      addCds: false
    });
    expect(parsePackageJson(projectDir)).toMatchSnapshot();
  });

  it('add scripts, dependencies and test config for scaffolded project', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'modify-package-json-existing');
    const packageJsonPath = path.resolve(projectDir, 'package.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'package.json'), packageJsonPath);

    await modifyPackageJson({
      projectDir,
      isScaffold: true,
      frontendScripts: true,
      force: false,
      addCds: false
    });
    expect(parsePackageJson(projectDir)).toMatchSnapshot();
  });
});
