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

const pathPrefix = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

function getCleanProjectDir(name: string) {
  const projectDir = path.resolve(pathPrefix, name);
  if (fs.existsSync(projectDir)) {
    fs.removeSync(projectDir);
  }
  return projectDir;
}

describe('Init', () => {
  const expressAppDir = path.resolve('test', 'express');
  const nestAppDir = path.resolve('test', 'nest');

  beforeAll(() => {
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix, { recursive: true });
    }
  });

  afterAll(() => {
    fs.removeSync(pathPrefix);
  });

  it('should create a new project with the necessary files', async () => {
    const projectDir = getCleanProjectDir('full-init');

    await Init.run(['--projectName=testingApp', '--buildScaffold', '--no-analytics', `--projectDir=${projectDir}`]);

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
  }, 240000);

  it('should add necessary files to an existing project', async () => {
    const projectDir = getCleanProjectDir('add-to-existing');
    fs.copySync(expressAppDir, projectDir, { recursive: true });

    await Init.run([
      '--projectName=testingApp',
      '--startCommand="npm start"',
      `--projectDir=${projectDir}`,
      '--no-analytics',
      '--skipInstall',
      '--force'
    ]);

    ['.npmrc', 'credentials.json', 'systems.json', 'manifest.yml']
      .map(file => path.resolve(projectDir, file))
      .forEach(path => {
        expect(fs.existsSync(path)).toBe(true);
      });
    expect(fs.existsSync(path.resolve(projectDir, 'test'))).toBe(false);
  }, 10000);

  it('init should detect and fail if there are conflicts', async () => {
    const projectDir = getCleanProjectDir('detect-conflicts');
    fs.copySync(nestAppDir, projectDir, { recursive: true });
    fs.createFileSync(`${projectDir}/.npmrc`);

    await Init.run(['--projectName=testingApp', '--startCommand="npm start"', `--projectDir=${projectDir}`, '--skipInstall', '--no-analytics']);

    expect(error).toHaveBeenCalledWith(
      'A file with the name ".npmrc" already exists. If you want to overwrite it, rerun the command with `--force`.',
      { exit: 1 }
    );
  }, 10000);

  it('should add to .gitignore if there is one', async () => {
    const projectDir = getCleanProjectDir('add-to-gitignore');
    fs.copySync(nestAppDir, projectDir, { recursive: true });

    await Init.run(['--projectName=testingApp', '--startCommand="npm start"', `--projectDir=${projectDir}`, '--skipInstall', '--no-analytics']);

    const gitignoreEntries = fs
      .readFileSync(`${projectDir}/.gitignore`, 'utf8')
      .split('\n')
      .filter(entry => entry !== '');

    expect(gitignoreEntries).toContain('credentials.json');
    expect(gitignoreEntries).toContain('/s4hana_pipeline');
    expect(gitignoreEntries).toContain('/deployment');
    expect(gitignoreEntries.length).toBeGreaterThan(29);
  }, 10000);

  it('should show a warning if the project is not using git', async () => {
    const projectDir = getCleanProjectDir('warn-on-no-git');

    fs.createFileSync(path.resolve(projectDir, 'package.json'));
    fs.writeFileSync(path.resolve(projectDir, 'package.json'), JSON.stringify({ name: 'project' }), 'utf8');

    await Init.run(['--projectName=testingApp', '--startCommand="npm start"', `--projectDir=${projectDir}`, '--skipInstall', '--no-analytics']);

    expect(warn).toHaveBeenCalledWith('No .gitignore file found!');
  }, 10000);

  it('should add our scripts and dependencies to the package.json', async () => {
    const projectDir = getCleanProjectDir('add-scripts-and-dependencies');
    fs.createFileSync(path.resolve(projectDir, 'package.json'));
    fs.writeFileSync(path.resolve(projectDir, 'package.json'), JSON.stringify({ name: 'project' }), 'utf8');

    await Init.run([
      '--projectName=testingApp',
      '--startCommand="npm start"',
      '--frontendScripts',
      `--projectDir=${projectDir}`,
      '--skipInstall',
      '--no-analytics'
    ]);

    const packageJson = JSON.parse(fs.readFileSync(path.resolve(projectDir, 'package.json'), 'utf8'));

    const dependencies = Object.keys(packageJson.dependencies);
    const devDependencies = Object.keys(packageJson.devDependencies);
    const scripts = Object.keys(packageJson.scripts);

    expect(dependencies).toContain('@sap/cloud-sdk-core');
    expect(devDependencies).toContain('@sap/cloud-sdk-test-util');
    ['ci-build', 'ci-package', 'ci-backend-unit-test', 'ci-frontend-unit-test', 'ci-integration-test', 'ci-e2e'].forEach(script =>
      expect(scripts).toContain(script)
    );
  }, 10000);

  it('should add the analytics file', async () => {
    const projectDir = getCleanProjectDir('add-to-gitignore');
    fs.copySync(nestAppDir, projectDir, { recursive: true });

    await Init.run([
      '--projectName=testingApp',
      '--startCommand="npm start"',
      `--projectDir=${projectDir}`,
      '--skipInstall',
      '--analytics',
      '--analyticsSalt=SAPCLOUDSDK4LIFE'
    ]);

    expect(JSON.parse(fs.readFileSync(`${projectDir}/sap-cloud-sdk-analytics.json`, 'utf8'))).toEqual({ enabled: true, salt: 'SAPCLOUDSDK4LIFE' });
  }, 10000);

  it('should add a disabled analytics file', async () => {
    const projectDir = getCleanProjectDir('add-to-gitignore');
    fs.copySync(expressAppDir, projectDir, { recursive: true });

    await Init.run(['--projectName=testingApp', '--startCommand="npm start"', `--projectDir=${projectDir}`, '--skipInstall', '--no-analytics']);

    expect(JSON.parse(fs.readFileSync(`${projectDir}/sap-cloud-sdk-analytics.json`, 'utf8'))).toEqual({ enabled: false });
  }, 10000);
});
