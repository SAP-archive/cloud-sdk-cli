/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
jest.mock('execa', () => jest.fn().mockResolvedValue('1.0.0'));

import * as execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { installDependencies, modifyPackageJson, parsePackageJson } from '../../src/utils';
import { getCleanProjectDir, getPathPrefix } from '../test-utils';

const pathPrefix = getPathPrefix(__dirname, __filename);

describe('Package Json Utils', () => {
  afterAll(() => {
    rm.sync(pathPrefix);
  });

  it('should call `npm install`', () => {
    installDependencies('', true);
    expect(execa).toHaveBeenCalledWith('npm', ['install'], { cwd: '', stdio: 'inherit' });
  });

  it('should parse the package.json', () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'parse-package-json');
    const packageJsonPath = path.resolve(projectDir, 'package.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'package.json'), packageJsonPath);

    expect(Object.keys(parsePackageJson(projectDir)).sort()).toMatchSnapshot();
  });

  it('add scripts, dependencies and test config for existing project', async () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'modify-package-json-existing');
    const packageJsonPath = path.resolve(projectDir, 'package.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'package.json'), packageJsonPath);

    await modifyPackageJson(projectDir, false, {
      frontendScripts: false,
      force: false,
      addCds: false
    });
    expect(parsePackageJson(projectDir)).toMatchSnapshot();
  });

  it('add scripts, dependencies and test config for scaffolded project', async () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'modify-package-json-existing');
    const packageJsonPath = path.resolve(projectDir, 'package.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'package.json'), packageJsonPath);

    await modifyPackageJson(projectDir, true, {
      frontendScripts: true,
      force: false,
      addCds: false
    });
    expect(parsePackageJson(projectDir)).toMatchSnapshot();
  });
});
