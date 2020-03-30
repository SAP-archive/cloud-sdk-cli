/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { copyFiles, findConflicts, getCopyDescriptors, getTemplatePaths, CopyDescriptor } from '../../src/utils';
import { getCleanProjectDir, getTestOutputDir } from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Templates Utils', () => {
  afterAll(() => {
    rm.sync(testOutputDir);
  });

  it('should return information which files to copy where', () => {
    const initCopyInfo = getCopyDescriptors('targetDir', getTemplatePaths(['init']));
    expect(initCopyInfo.map(copyInfo => copyInfoToPathArray(copyInfo)).sort()).toMatchSnapshot();

    const appRouterCopyInfo = getCopyDescriptors('targetDir', getTemplatePaths(['add-approuter']));
    expect(
      appRouterCopyInfo
        .map(copyInfo => copyInfo.fileName.split('targetDir' + path.sep)[1])
        .sort()
        .map(fileName => fileName.split(path.sep))
    ).toMatchSnapshot();
  });

  it('should find conflicts', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'find-conflicts');
    fs.writeFileSync(path.resolve(projectDir, '.npmrc'), 'foobar');
    findConflicts(getCopyDescriptors(projectDir, getTemplatePaths(['init'])), true);
    expect(fs.existsSync(path.resolve(projectDir, '.npmrc'))).toBe(false);
  });

  it('should copy files locally', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'copy-files-locally');
    copyFiles(getCopyDescriptors(projectDir, getTemplatePaths(['init'])), {});
    expect(fs.readdirSync(projectDir).sort()).toMatchSnapshot();
  });

  // TODO:
  // it('should copy files remotely', async () => {
  //   const projectDir = getCleanProjectDir(testOutputDir, 'copy-files-remotely');
  // });

  function copyInfoToPathArray(copyInfo: CopyDescriptor): string[] {
    const filePathBeginnginFromTargetDir = path.relative(path.resolve('targetDir'), copyInfo.fileName);
    const filePathAsList = filePathBeginnginFromTargetDir.split(path.sep);
    return filePathAsList;
  }
});
