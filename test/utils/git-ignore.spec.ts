/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jest.mock('../../src/utils/warnings');
import * as fs from 'fs';
import * as rm from 'rimraf';
import { modifyGitIgnore, recordWarning } from '../../src/utils';
import { getCleanProjectDir, getTestOutputDir } from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Git Ignore Utils', () => {
  afterAll(() => {
    rm.sync(testOutputDir);
  });

  it('should add paths to empty git ignore', () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'empty-git-ignore');
    fs.writeFileSync(`${projectDir}/.gitignore`, '');

    modifyGitIgnore(projectDir, false);

    const gitIgnoreContent = fs.readFileSync(`${projectDir}/.gitignore`, { encoding: 'utf8' }).split('\n');
    expect(gitIgnoreContent).toIncludeAllMembers(['/s4hana_pipeline', 'credentials.json']);
  });

  it('should add cds paths to empty git ignore', () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'empty-git-ignore-cds');
    fs.writeFileSync(`${projectDir}/.gitignore`, '');

    modifyGitIgnore(projectDir, true);

    const gitIgnoreContent = fs.readFileSync(`${projectDir}/.gitignore`, { encoding: 'utf8' }).split('\n');
    expect(gitIgnoreContent).toIncludeAllMembers(['gen/', '*.db']);
  });

  it('should add paths to existing git ignore', () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'existing-git-ignore');
    fs.writeFileSync(
      `${projectDir}/.gitignore`,
      `myPath
      foobar

      !@#$%^&^
      \\n`
    );
    modifyGitIgnore(projectDir, false);

    const gitIgnoreContent = fs.readFileSync(`${projectDir}/.gitignore`, { encoding: 'utf8' }).split('\n');
    expect(gitIgnoreContent).toIncludeAllMembers(['/s4hana_pipeline', 'myPath', 'credentials.json']);
  });

  it('warn if there is no git ignore', () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'no-git-ignore');

    modifyGitIgnore(projectDir, false);

    expect(recordWarning).toHaveBeenCalledWith(
      'No .gitignore file found!',
      'If your project is using a different version control system,',
      'please make sure the following paths are not tracked:',
      '  credentials.json',
      '  /s4hana_pipeline',
      '  /deployment'
    );
  });
});
