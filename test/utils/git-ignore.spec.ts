/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */
jest.mock('../../src/utils/warnings');
import * as fs from 'fs-extra';
import { modifyGitIgnore, recordWarning, rm } from '../../src/utils';
import {
  getCleanProjectDir,
  getTestOutputDir,
  TimeThresholds
} from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Git Ignore Utils', () => {
  beforeAll(async () => {
    await rm(testOutputDir);
  }, TimeThresholds.EXTRA_SHORT);

  it(
    'should add paths to empty git ignore',
    async () => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'empty-git-ignore'
      );
      await fs.writeFile(`${projectDir}/.gitignore`, '');

      await modifyGitIgnore(projectDir, false);

      const gitIgnoreContent = (
        await fs.readFile(`${projectDir}/.gitignore`, { encoding: 'utf8' })
      ).split('\n');
      expect(gitIgnoreContent).toIncludeAllMembers([
        '/s4hana_pipeline',
        'credentials.json'
      ]);
    },
    TimeThresholds.EXTRA_SHORT
  );

  it(
    'should add cds paths to empty git ignore',
    async () => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'empty-git-ignore-cds'
      );
      await fs.writeFile(`${projectDir}/.gitignore`, '');

      await modifyGitIgnore(projectDir, true);

      const gitIgnoreContent = (
        await fs.readFile(`${projectDir}/.gitignore`, { encoding: 'utf8' })
      ).split('\n');
      expect(gitIgnoreContent).toIncludeAllMembers(['gen/', '*.db']);
    },
    TimeThresholds.EXTRA_SHORT
  );

  it(
    'should add paths to existing git ignore',
    async () => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'existing-git-ignore'
      );
      await fs.writeFile(
        `${projectDir}/.gitignore`,
        `myPath
      foobar

      !@#$%^&^
      \\n`
      );
      await modifyGitIgnore(projectDir, false);

      const gitIgnoreContent = (
        await fs.readFile(`${projectDir}/.gitignore`, { encoding: 'utf8' })
      ).split('\n');
      expect(gitIgnoreContent).toIncludeAllMembers([
        '/s4hana_pipeline',
        'myPath',
        'credentials.json'
      ]);
    },
    TimeThresholds.EXTRA_SHORT
  );

  it(
    'warn if there is no git ignore',
    async () => {
      const projectDir = await getCleanProjectDir(
        testOutputDir,
        'no-git-ignore'
      );

      await modifyGitIgnore(projectDir, false);

      expect(recordWarning).toHaveBeenCalledWith(
        'No .gitignore file found!',
        'If your project is using a different version control system,',
        'please make sure the following paths are not tracked:',
        '  credentials.json',
        '  /s4hana_pipeline',
        '  /deployment'
      );
    },
    TimeThresholds.EXTRA_SHORT
  );
});
