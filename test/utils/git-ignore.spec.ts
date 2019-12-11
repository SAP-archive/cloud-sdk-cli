/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
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
import * as path from 'path';
import * as rm from 'rimraf';
import { modifyGitIgnore } from '../../src/utils';

const pathPrefix = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

function getCleanProjectDir(name: string) {
  const projectDir = path.resolve(pathPrefix, name);
  if (fs.existsSync(projectDir)) {
    rm.sync(projectDir);
  }
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}

describe('Git Ignore Utils', () => {
  afterAll(() => {
    rm.sync(pathPrefix);
  });

  it('should add paths to empty git ignore', () => {
    const projectDir = getCleanProjectDir('empty-git-ignore');
    fs.writeFileSync(`${projectDir}/.gitignore`, '');

    modifyGitIgnore(projectDir);

    const gitIgnoreContent = fs.readFileSync(`${projectDir}/.gitignore`, { encoding: 'utf8' }).split('\n');
    expect(gitIgnoreContent).toContain('/s4hana_pipeline');
    expect(gitIgnoreContent).toContain('credentials.json');
  });

  it('should add paths to existing git ignore', () => {
    const projectDir = getCleanProjectDir('existing-git-ignore');
    fs.writeFileSync(
      `${projectDir}/.gitignore`,
      `myPath
      foobar

      !@#$%^&^
      \\n`
    );
    modifyGitIgnore(projectDir);

    const gitIgnoreContent = fs.readFileSync(`${projectDir}/.gitignore`, { encoding: 'utf8' }).split('\n');
    expect(gitIgnoreContent).toContain('/s4hana_pipeline');
    expect(gitIgnoreContent).toContain('credentials.json');
  });

  it('warn if there is no git ignore', () => {
    const projectDir = getCleanProjectDir('no-git-ignore');

    modifyGitIgnore(projectDir);

    expect(warn).toHaveBeenCalledWith('No .gitignore file found!');
    expect(log).toHaveBeenCalledTimes(4);
  });
});
