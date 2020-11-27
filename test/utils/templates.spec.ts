/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */
import * as path from 'path';
import * as fs from 'fs-extra';
import {
  CopyDescriptor,
  copyFiles,
  findConflicts,
  getCopyDescriptors,
  getTemplatePaths,
  rm
} from '../../src/utils';
import {
  getCleanProjectDir,
  getTestOutputDir,
  TimeThresholds
} from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Templates Utils', () => {
  beforeAll(async () => {
    await rm(testOutputDir);
  }, TimeThresholds.EXTRA_SHORT);

  it(
    'should return information which files to copy where',
    () => {
      const initCopyInfo = getCopyDescriptors(
        'targetDir',
        getTemplatePaths(['init'])
      );
      expect(
        initCopyInfo.map(copyInfo => copyInfoToPathArray(copyInfo)).sort()
      ).toMatchSnapshot();

      const appRouterCopyInfo = getCopyDescriptors(
        'targetDir',
        getTemplatePaths(['add-approuter'])
      );
      expect(
        appRouterCopyInfo.map(info => copyInfoToPathArray(info).sort())
      ).toMatchSnapshot();
    },
    TimeThresholds.EXTRA_SHORT
  );

  it(
    'should find conflicts',
    async () => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'find-conflicts'
      );
      await fs.writeFile(path.resolve(projectDir, 'manifest.yml'), 'foobar');
      findConflicts(
        getCopyDescriptors(projectDir, getTemplatePaths(['init'])),
        true
      );
      try {
        await fs.stat(path.resolve(projectDir, 'manifest.yml'));
      } catch (e) {
        expect(e.message).toMatch(/no such file or directory.*manifest.yml/);
      }
    },
    TimeThresholds.EXTRA_SHORT
  );

  it(
    'should copy files locally',
    async () => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'copy-files-locally'
      );
      await copyFiles(
        getCopyDescriptors(projectDir, getTemplatePaths(['init'])),
        {}
      );
      return fs
        .readdir(projectDir)
        .then(value => expect(value).toMatchSnapshot);
    },
    TimeThresholds.EXTRA_SHORT
  );

  // TODO:
  // it('should copy files remotely', async () => {
  //   const projectDir = getCleanProjectDir(testOutputDir, 'copy-files-remotely');
  // });

  function copyInfoToPathArray(copyInfo: CopyDescriptor): string[] {
    const filePathBeginnginFromTargetDir = path.relative(
      path.resolve('targetDir'),
      copyInfo.fileName
    );
    const filePathAsList = filePathBeginnginFromTargetDir.split(path.sep);
    return filePathAsList;
  }
});
