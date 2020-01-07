/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
const log = jest.fn();
const warn = jest.fn(message => console.log('MOCKED WARNING: ', message));

jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      log,
      warn
    }
  };
});

import * as fs from 'fs';
import * as rm from 'rimraf';
import { modifyGitIgnore } from '../../src/utils';
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
    expect(gitIgnoreContent).toContain('/s4hana_pipeline');
    expect(gitIgnoreContent).toContain('credentials.json');
  });

  it('should add cds paths to empty git ignore', () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'empty-git-ignore-cds');
    fs.writeFileSync(`${projectDir}/.gitignore`, '');

    modifyGitIgnore(projectDir, true);

    const gitIgnoreContent = fs.readFileSync(`${projectDir}/.gitignore`, { encoding: 'utf8' }).split('\n');
    expect(gitIgnoreContent).toContain('gen/');
    expect(gitIgnoreContent).toContain('*.db');
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
    expect(gitIgnoreContent).toContain('/s4hana_pipeline');
    expect(gitIgnoreContent).toContain('myPath');
    expect(gitIgnoreContent).toContain('credentials.json');
  });

  it('warn if there is no git ignore', () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'no-git-ignore');

    modifyGitIgnore(projectDir, false);

    expect(warn).toHaveBeenCalledWith('No .gitignore file found!');
    expect(log).toHaveBeenCalledTimes(4);
  });
});
