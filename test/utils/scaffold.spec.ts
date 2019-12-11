/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
const confirm = jest.fn().mockResolvedValue(true);
jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      confirm
    }
  };
});

import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { buildScaffold, shouldBuildScaffold } from '../../src/utils';

const pathPrefix = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

function getCleanProjectDir(name: string) {
  const projectDir = path.resolve(pathPrefix, name);
  if (fs.existsSync(projectDir)) {
    rm.sync(projectDir);
  }
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}

describe('Scaffold Utils', () => {
  afterAll(() => {
    rm.sync(pathPrefix);
  });

  it('should determine if scaffold is needed', async () => {
    const projectDir = getCleanProjectDir('should-build-scaffold');

    expect(await shouldBuildScaffold(projectDir, false)).toBe(true);
    expect(await shouldBuildScaffold(projectDir, true)).toBe(true);

    const packageJsonPath = path.resolve(projectDir, 'package.json');
    fs.copyFileSync(path.resolve('test', 'nest', 'package.json'), packageJsonPath);
    expect(await shouldBuildScaffold(projectDir, false)).toBe(false);
  });

  it('should build the scaffold', async () => {
    const projectDir = getCleanProjectDir('build-scaffold');

    await buildScaffold(projectDir, false);

    expect(fs.readdirSync(projectDir).sort()).toMatchSnapshot();
  }, 120000);
});
