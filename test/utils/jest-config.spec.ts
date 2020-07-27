/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import { getJestConfig, modifyJestConfig } from '../../src/utils';
import { deleteAsync, getCleanProjectDir, getTestOutputDir } from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Jest Config Utils', () => {
  afterAll(async () => {
    await deleteAsync(testOutputDir, 3);
  });

  it('returns jest config object for tests', () => {
    expect(getJestConfig(true)).toMatchSnapshot();
    expect(getJestConfig(false)).toMatchSnapshot();
  });

  it('returns adds jest config to file', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'jest-config');
    const jestConfigPath = path.resolve(projectDir, 'jest-e2e.json');
    await fs.copyFile(path.resolve('test', 'nest', 'test', 'jest-e2e.json'), jestConfigPath);

    modifyJestConfig(jestConfigPath, getJestConfig(false));

    expect(JSON.parse(await fs.readFile(jestConfigPath, { encoding: 'utf8' }))).toMatchObject(getJestConfig(false));
  });
});
