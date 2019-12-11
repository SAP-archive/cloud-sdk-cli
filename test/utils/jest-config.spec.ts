/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { getJestConfig, modifyJestConfig } from '../../src/utils';

const pathPrefix = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

function getCleanProjectDir(name: string) {
  const projectDir = path.resolve(pathPrefix, name);
  if (fs.existsSync(projectDir)) {
    rm.sync(projectDir);
  }
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}

describe('Jest Config Utils', () => {
  afterAll(() => {
    rm.sync(pathPrefix);
  });

  it('returns jest config object for tests', () => {
    expect(getJestConfig(true)).toMatchSnapshot();
    expect(getJestConfig(false)).toMatchSnapshot();
  });

  it('returns adds jest config to file', () => {
    const projectDir = getCleanProjectDir('jest-config');
    const jestConfigPath = path.resolve(projectDir, 'jest-e2e.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'test', 'jest-e2e.json'), jestConfigPath);

    modifyJestConfig(jestConfigPath, getJestConfig(false));

    expect(JSON.parse(fs.readFileSync(jestConfigPath, { encoding: 'utf8' }))).toMatchObject(getJestConfig(false));
  });
});
