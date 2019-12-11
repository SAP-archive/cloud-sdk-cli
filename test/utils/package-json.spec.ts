/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
jest.mock('execa', () => jest.fn().mockResolvedValue('1.0.0'));

import * as execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { installDependencies, modifyPackageJson, parsePackageJson } from '../../src/utils';

const pathPrefix = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

function getCleanProjectDir(name: string) {
  const projectDir = path.resolve(pathPrefix, name);
  if (fs.existsSync(projectDir)) {
    rm.sync(projectDir);
  }
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}

describe('Package Json Utils', () => {
  afterAll(() => {
    rm.sync(pathPrefix);
  });

  it('should call `npm install`', () => {
    installDependencies('', true);
    expect(execa).toHaveBeenCalledWith('npm', ['install'], { cwd: '', stdio: 'inherit' });
  });

  it('should parse the package.json', () => {
    const projectDir = getCleanProjectDir('parse-package-json');
    const packageJsonPath = path.resolve(projectDir, 'package.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'package.json'), packageJsonPath);

    expect(Object.keys(parsePackageJson(projectDir)).sort()).toMatchSnapshot();
  });

  it('add scripts, dependencies and test config for existing project', async () => {
    const projectDir = getCleanProjectDir('modify-package-json-existing');
    const packageJsonPath = path.resolve(projectDir, 'package.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'package.json'), packageJsonPath);

    await modifyPackageJson(projectDir, false, {
      frontendScripts: false
    });
    expect(parsePackageJson(projectDir)).toMatchSnapshot();
  });

  it('add scripts, dependencies and test config for scaffolded project', async () => {
    const projectDir = getCleanProjectDir('modify-package-json-existing');
    const packageJsonPath = path.resolve(projectDir, 'package.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'package.json'), packageJsonPath);

    await modifyPackageJson(projectDir, true, {
      frontendScripts: true
    });
    expect(parsePackageJson(projectDir)).toMatchSnapshot();
  });
});
