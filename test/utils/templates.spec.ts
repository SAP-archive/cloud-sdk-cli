/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { copyFiles, findConflicts, getCopyDescriptors, getTemplatePaths } from '../../src/utils';
import { getCleanProjectDir, getPathPrefix } from '../test-utils';

const pathPrefix = getPathPrefix(__dirname, __filename);

describe('Templates Utils', () => {
  afterAll(() => {
    rm.sync(pathPrefix);
  });

  it('should return information which files to copy where', () => {
    const initCopyInfo = getCopyDescriptors('targetDir', getTemplatePaths(['init']));
    expect(initCopyInfo.map(copyInfo => path.basename(copyInfo.fileName)).sort()).toMatchSnapshot();

    const appRouterCopyInfo = getCopyDescriptors('targetDir', getTemplatePaths(['add-approuter']));
    expect(appRouterCopyInfo.map(copyInfo => path.basename(copyInfo.fileName)).sort()).toMatchSnapshot();
  });

  it('should find conflicts', async () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'find-conflicts');
    fs.writeFileSync(path.resolve(projectDir, '.npmrc'), 'foobar');
    findConflicts(getCopyDescriptors(projectDir, getTemplatePaths(['init'])), true);
    expect(fs.existsSync(path.resolve(projectDir, '.npmrc'))).toBe(false);
  });

  it('should copy files locally', async () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'copy-files-locally');
    copyFiles(getCopyDescriptors(projectDir, getTemplatePaths(['init'])), {});
    expect(fs.readdirSync(projectDir).sort()).toMatchSnapshot();
  });

  // it('should copy files remotely', async () => {
  //   const projectDir = getCleanProjectDir(pathPrefix, 'copy-files-remotely');
  // });
});
