/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { copyFiles, ensureDirectoryExists, findConflicts, getCopyDescriptors, getTemplatePaths } from '../../src/utils';

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

    ensureDirectoryExists(dir, true);
    expect(fs.existsSync(dir)).toBe(true);

    ensureDirectoryExists(file);
    expect(fs.existsSync(path.resolve(dir, 'abc'))).toBe(true);
  });

  it('should return information which files to copy where', () => {
    const initCopyInfo = getCopyDescriptors('targetDir', getTemplatePaths(['init']));
    expect(initCopyInfo.map(copyInfo => path.basename(copyInfo.fileName)).sort()).toMatchSnapshot();

    const appRouterCopyInfo = getCopyDescriptors('targetDir', getTemplatePaths(['add-approuter']));
    expect(appRouterCopyInfo.map(copyInfo => path.basename(copyInfo.fileName)).sort()).toMatchSnapshot();
  });

  it('should find conflicts', async () => {
    const projectDir = getCleanProjectDir('find-conflicts');
    fs.writeFileSync(path.resolve(projectDir, '.npmrc'), 'foobar');
    findConflicts(getCopyDescriptors(projectDir, getTemplatePaths(['init'])), true);
    expect(fs.existsSync(path.resolve(projectDir, '.npmrc'))).toBe(false);
  });

  it('should copy files locally', async () => {
    const projectDir = getCleanProjectDir('copy-files-locally');
    copyFiles(getCopyDescriptors(projectDir, getTemplatePaths(['init'])), {});
    expect(fs.readdirSync(projectDir).sort()).toMatchSnapshot();
  });

  // it('should copy files remotely', async () => {
  //   const projectDir = getCleanProjectDir('copy-files-remotely');
  // });
});
