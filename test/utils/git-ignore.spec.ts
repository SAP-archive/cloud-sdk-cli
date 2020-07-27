/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jest.mock('../../src/utils/warnings');
import * as fs from 'fs-extra';
import { modifyGitIgnore, recordWarning } from '../../src/utils';
import { deleteAsync, getCleanProjectDir, getTestOutputDir } from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Git Ignore Utils', () => {
  afterAll(async () => {
    await deleteAsync(testOutputDir, 3);
  });

  it('should add paths to empty git ignore', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'empty-git-ignore');
    await fs.writeFile(`${projectDir}/.gitignore`, '');

    modifyGitIgnore(projectDir, false);

    const gitIgnoreContent = (await fs.readFile(`${projectDir}/.gitignore`, { encoding: 'utf8' })).split('\n');
    expect(gitIgnoreContent).toIncludeAllMembers(['/s4hana_pipeline', 'credentials.json']);
  });

  it('should add cds paths to empty git ignore', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'empty-git-ignore-cds');
    await fs.writeFile(`${projectDir}/.gitignore`, '');

    modifyGitIgnore(projectDir, true);

    const gitIgnoreContent = (await fs.readFile(`${projectDir}/.gitignore`, { encoding: 'utf8' })).split('\n');
    expect(gitIgnoreContent).toIncludeAllMembers(['gen/', '*.db']);
  });

  it('should add paths to existing git ignore', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'existing-git-ignore');
    await fs.writeFile(
      `${projectDir}/.gitignore`,
      `myPath
      foobar

      !@#$%^&^
      \\n`
    );
    modifyGitIgnore(projectDir, false);

    const gitIgnoreContent = (await fs.readFile(`${projectDir}/.gitignore`, { encoding: 'utf8' })).split('\n');
    expect(gitIgnoreContent).toIncludeAllMembers(['/s4hana_pipeline', 'myPath', 'credentials.json']);
  });

  it('warn if there is no git ignore', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'no-git-ignore');

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
