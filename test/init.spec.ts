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

describe('Init', () => {
  const pathPrefix = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

  beforeAll(() => {
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  });

  afterAll(() => {
    fs.removeSync(pathPrefix);
  });

  it('should create a new project with the necessary files', async () => {
    const projectDir = path.resolve(pathPrefix, 'full-init');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    const argv = ['--projectName=testingApp', '--buildScaffold', `--projectDir=${projectDir}`];
    await Init.run(argv);

    ['.npmrc', 'credentials.json', 'systems.json', 'manifest.yml']
      .map(file => path.resolve(projectDir, file))
      .forEach(path => {
        expect(fs.existsSync(path)).toBe(true);
      });
  }, 60000);

  it('should create test cases when building a project with scaffold', async () => {
    const projectDir = path.resolve(pathPrefix, 'full-init-with-test');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    const argv = ['--projectName=testingApp', '--buildScaffold', `--projectDir=${projectDir}`];
    await Init.run(argv);

    const reportsPath = path.resolve(projectDir, 's4hana_pipeline', 'reports');

    // execute the ci scripts and check if the reports are written
    await execa('npm', ['run', 'ci-backend-unit-test'], { cwd: projectDir, stdio: 'inherit' });
    const pathBackendUnit = path.resolve(reportsPath, 'backend-unit');
    const pathCoverageUnit = path.resolve(reportsPath, 'coverage-reports', 'backend-unit');
    expect(fs.readdirSync(pathBackendUnit).length).toBeGreaterThan(1);
    expect(fs.readdirSync(pathCoverageUnit).length).toBeGreaterThan(1);

    await execa('npm', ['run', 'ci-integration-test'], { cwd: projectDir, stdio: 'inherit' });
    const pathBackendIntegration = path.resolve(reportsPath, 'backend-integration');
    const pathCoverageIntegration = path.resolve(reportsPath, 'coverage-reports', 'backend-integration');
    console.log('Backend Integration', fs.readdirSync(pathBackendIntegration));
    console.log('Coverage Integration', fs.readdirSync(pathCoverageIntegration));
    expect(fs.readdirSync(pathBackendIntegration).length).toBeGreaterThan(1);
    expect(fs.readdirSync(pathCoverageIntegration).length).toBeGreaterThan(1);
  }, 60000);

  it('should add necessary files to an existing project', async () => {
    const expressAppDir = 'test/express/';
    const projectDir = path.resolve(pathPrefix, 'add-to-existing');

    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }
    fs.copySync(expressAppDir, projectDir, { recursive: true });

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', `--projectDir=${projectDir}`, '--force'];
    await Init.run(argv);
    ['.npmrc', 'credentials.json', 'systems.json', 'manifest.yml']
      .map(file => path.resolve(projectDir, file))
      .forEach(path => {
        expect(fs.existsSync(path)).toBe(true);
      });

    ['jest.config.js', 'jest.integration-test.config.js', 'jets.unit-test.config.js']
      .map(file => path.resolve(projectDir, file))
      .forEach(path => {
        expect(fs.existsSync(path)).toBe(false);
      });

    expect(fs.existsSync(path.resolve(projectDir, 'test'))).toBe(false);
  }, 20000);

  it('init should detect and fail if there are conflicts', async () => {
    const appDir = 'test/nest/';
    const projectDir = path.resolve(pathPrefix, 'detect-conflicts');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }
    fs.copySync(appDir, projectDir, { recursive: true });
    fs.createFileSync(`${projectDir}/.npmrc`);

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', `--projectDir=${projectDir}`];
    await Init.run(argv);

    expect(error).toHaveBeenCalledWith(
      'A file with the name ".npmrc" already exists. If you want to overwrite it, rerun the command with `--force`.',
      { exit: 1 }
    );
  }, 60000);

  it('should add to gitignore if there is one', async () => {
    const exampleAppDir = 'test/nest/';
    const projectDir = path.resolve(pathPrefix, 'add-to-gitignore');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }
    fs.copySync(exampleAppDir, projectDir, { recursive: true });

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', `--projectDir=${projectDir}`];
    await Init.run(argv);

    const gitignoreEntries = fs
      .readFileSync(`${projectDir}/.gitignore`, 'utf8')
      .split('\n')
      .filter(entry => entry !== '');

    expect(gitignoreEntries).toContain('credentials.json');
    expect(gitignoreEntries).toContain('/s4hana_pipeline');
    expect(gitignoreEntries).toContain('/deployment');
    expect(gitignoreEntries.length).toBeGreaterThan(29);
  }, 50000);

  it('should show a warning if the project is not using git', async () => {
    const projectDir = path.resolve(pathPrefix, 'warn-on-no-git');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    fs.createFileSync(path.resolve(projectDir, 'package.json'));
    fs.writeFileSync(path.resolve(projectDir, 'package.json'), JSON.stringify({ name: 'project' }), 'utf8');

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', `--projectDir=${projectDir}`];
    await Init.run(argv);

    expect(warn).toHaveBeenCalledWith('No .gitignore file found!');
  }, 30000);

  it('should add our scripts and dependencies to the package.json', async () => {
    const projectDir = path.resolve(pathPrefix, 'add-scripts-and-dependencies');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    fs.createFileSync(path.resolve(projectDir, 'package.json'));
    fs.writeFileSync(path.resolve(projectDir, 'package.json'), JSON.stringify({ name: 'project' }), 'utf8');

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', '--frontendScripts', `--projectDir=${projectDir}`];
    await Init.run(argv);

    const packageJson = JSON.parse(fs.readFileSync(path.resolve(projectDir, 'package.json'), 'utf8'));

    const dependencies = Object.keys(packageJson.dependencies);
    const devDependencies = Object.keys(packageJson.devDependencies);
    const scripts = Object.keys(packageJson.scripts);

    expect(dependencies).toContain('@sap/cloud-sdk-core');
    expect(devDependencies).toContain('@sap/cloud-sdk-test-util');
    ['ci-build', 'ci-package', 'ci-backend-unit-test', 'ci-frontend-unit-test', 'ci-integration-test', 'ci-e2e'].forEach(script =>
      expect(scripts).toContain(script)
    );
  }, 20000);
});
