/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
const error = jest.fn();
const warn = jest.fn(message => console.log('MOCKED WARNING: ', message));
jest.mock('@oclif/command', () => {
  const command = jest.requireActual('@oclif/command');
  command.Command.prototype.warn = warn;
  return command;
});

jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      error,
      warn
    }
  };
});

import execa = require('execa');
import * as fs from 'fs-extra';
import * as path from 'path';
import Init from '../src/commands/init';
import { getCleanProjectDir, getPathPrefix } from './test-utils';

const pathPrefix = getPathPrefix(__dirname, __filename);

describe('Init', () => {
  // describe('full scaffold', () => {
  beforeAll(() => {
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix, { recursive: true });
    }
  });

  afterAll(() => {
    fs.removeSync(pathPrefix);
  });

  it('should create a new project with the necessary files', async () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'full-init');

    await Init.run(['--projectName=testingApp', '--buildScaffold', '--no-analytics', `--projectDir=${projectDir}`, '--verbose']);

    ['.npmrc', 'credentials.json', 'systems.json', 'manifest.yml']
      .map(file => path.resolve(projectDir, file))
      .forEach(path => {
        expect(fs.existsSync(path)).toBe(true);
      });

    const reportsPath = path.resolve(projectDir, 's4hana_pipeline', 'reports');

    // execute the ci scripts and check if the reports are written
    await execa('npm', ['run', 'ci-backend-unit-test'], { cwd: projectDir, stdio: 'inherit' });
    expect(fs.readdirSync(path.resolve(reportsPath, 'backend-unit')).length).toBeGreaterThan(1);
    expect(fs.readdirSync(path.resolve(reportsPath, 'coverage-reports', 'backend-unit')).length).toBeGreaterThan(1);

    await execa('npm', ['run', 'ci-integration-test'], { cwd: projectDir, stdio: 'inherit' });
    expect(fs.readdirSync(path.resolve(reportsPath, 'backend-integration')).length).toBeGreaterThan(1);
    expect(fs.readdirSync(path.resolve(reportsPath, 'coverage-reports', 'backend-integration')).length).toBeGreaterThan(1);
  }, 2400000);
  // });
});
