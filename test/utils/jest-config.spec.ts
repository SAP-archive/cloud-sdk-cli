/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { getJestConfig, modifyJestConfig } from '../../src/utils';
import { getCleanProjectDir, getTestOutputDir } from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Jest Config Utils', () => {
  afterAll(() => {
    rm.sync(testOutputDir);
  });

  it('returns jest config object for tests', () => {
    expect(getJestConfig(true)).toMatchSnapshot();
    expect(getJestConfig(false)).toMatchSnapshot();
  });

  it('returns adds jest config to file', () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'jest-config');
    const jestConfigPath = path.resolve(projectDir, 'jest-e2e.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'test', 'jest-e2e.json'), jestConfigPath);

    modifyJestConfig(jestConfigPath, getJestConfig(false));

    expect(JSON.parse(fs.readFileSync(jestConfigPath, { encoding: 'utf8' }))).toMatchObject(getJestConfig(false));
  });
});
