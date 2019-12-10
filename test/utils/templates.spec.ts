/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
const warn = jest.fn();
const confirm = jest.fn().mockResolvedValue(true);

jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      confirm,
      warn
    }
  };
});

import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { copyFiles, ensureDirectoryExistence, findConflicts, readTemplates } from '../../src/utils';

const pathPrefix = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

function getCleanProjectDir(name: string) {
  const projectDir = path.resolve(pathPrefix, name);
  if (fs.existsSync(projectDir)) {
    rm.sync(projectDir);
  }
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}

describe('Templates Utils', () => {
  afterAll(() => {
    rm.sync(pathPrefix);
  });

  it('ensure directory existence', () => {
    const projectDir = getCleanProjectDir('ensure-dir-existence');
    const dir = path.resolve(projectDir, 'foo', 'bar');
    const file = path.resolve(dir, 'abc', 'package.json');

    ensureDirectoryExistence(dir, true);
    expect(fs.existsSync(dir)).toBe(true);

    ensureDirectoryExistence(file);
    expect(fs.existsSync(path.resolve(dir, 'abc'))).toBe(true);
  });

  it('should return information which files to copy where', () => {
    expect(
      readTemplates({
        from: [path.resolve(__dirname, '..', '..', 'src', 'templates', 'init')],
        to: 'abcdef'
      })
    ).toMatchSnapshot();

    expect(
      readTemplates({
        from: [path.resolve(__dirname, '..', '..', 'src', 'templates', 'add-approuter')],
        to: 'blablabla'
      })
    ).toMatchSnapshot();
  });

  it('should find conflicts', async () => {
    const projectDir = getCleanProjectDir('find-conflicts');
    fs.writeFileSync(path.resolve(projectDir, '.npmrc'), 'foobar');
    findConflicts(
      readTemplates({
        from: [path.resolve(__dirname, '..', '..', 'src', 'templates', 'init')],
        to: projectDir
      }),
      true
    );
    expect(fs.existsSync(path.resolve(projectDir, '.npmrc'))).toBe(false);
  });

  it('should copy files locally', async () => {
    const projectDir = getCleanProjectDir('copy-files-locally');
    copyFiles(
      readTemplates({
        from: [path.resolve(__dirname, '..', '..', 'src', 'templates', 'init')],
        to: projectDir
      }),
      {}
    );
    expect(fs.readdirSync(projectDir)).toMatchSnapshot();
  });

  // it('should copy files remotely', async () => {
  //   const projectDir = getCleanProjectDir('copy-files-remotely');
  // });
});
