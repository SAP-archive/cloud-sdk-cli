/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import { CopyDescriptor, copyFiles, findConflicts, getCopyDescriptors, getTemplatePaths } from '../../src/utils';
import { deleteAsync, getCleanProjectDir, getTestOutputDir, TimeThresholds } from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Templates Utils', () => {
  beforeAll(async () => {
    deleteAsync(testOutputDir, 3);
  }, TimeThresholds.EXTRA_SHORT);

  it(
    'should return information which files to copy where',
    () => {
      const initCopyInfo = getCopyDescriptors('targetDir', getTemplatePaths(['init']));
      expect(initCopyInfo.map(copyInfo => copyInfoToPathArray(copyInfo)).sort()).toMatchSnapshot();

      const appRouterCopyInfo = getCopyDescriptors('targetDir', getTemplatePaths(['add-approuter']));
      expect(appRouterCopyInfo.map(appRouterCopyInfo => copyInfoToPathArray(appRouterCopyInfo).sort())).toMatchSnapshot();
    },
    TimeThresholds.EXTRA_SHORT
  );

  it(
    'should find conflicts',
    async () => {
      const projectDir = await getCleanProjectDir(testOutputDir, 'find-conflicts');
      await fs.writeFile(path.resolve(projectDir, '.npmrc'), 'foobar');
      findConflicts(getCopyDescriptors(projectDir, getTemplatePaths(['init'])), true);
      try {
        await fs.stat(path.resolve(projectDir, '.npmrc'));
      } catch (e) {
        expect(e.message).toMatch(/no such file or directory.*npmrc/);
      }
    },
    TimeThresholds.EXTRA_SHORT
  );

  it(
    'should copy files locally',
    async () => {
      const projectDir = await getCleanProjectDir(testOutputDir, 'copy-files-locally');
      await copyFiles(getCopyDescriptors(projectDir, getTemplatePaths(['init'])), {});
      return fs.readdir(projectDir).then(value => expect(value).toMatchSnapshot);
    },
    TimeThresholds.EXTRA_SHORT
  );

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
