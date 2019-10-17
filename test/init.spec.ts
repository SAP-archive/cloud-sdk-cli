/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
const confirm = jest.fn().mockResolvedValue(true);
jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      confirm
    }
  };
});

const warn = jest.fn(message => console.log('MOCKED WARNING: ', message));
jest.mock('@oclif/command', () => {
  const command = jest.requireActual('@oclif/command');
  command.Command.prototype.warn = warn;
  return command;
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

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', '--frontendScripts', '--initWithExpress', `--projectDir=${projectDir}`];
    await Init.run(argv);

    ['.npmrc', 'credentials.json', 'systems.json', 'manifest.yml']
      .map(file => path.resolve(projectDir, file))
      .forEach(path => {
        expect(fs.existsSync(path)).toBe(true);
      });
  }, 60000);

  it('should create test cases for a fresh express project.', async () => {
    const projectDir = path.resolve(pathPrefix, 'full-init-with-test');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', '--frontendScripts', '--initWithExpress', `--projectDir=${projectDir}`];
    await Init.run(argv);

    // execute the local tests
    await execa('npm', ['i'], {cwd: projectDir});
    const testResult = await execa('npm', ['test'], { cwd: projectDir });

    // execute the ci scripts and check if the reports are written
    await execa('npm', ['run', 'ci-integration-test'], { cwd: projectDir });
    const pathBackendIntegration = path.resolve(projectDir, 's4hana_pipeline', 'reports', 'backend-integration');
    expect(fs.readdirSync(pathBackendIntegration).length).not.toBe(0);

    await execa('npm', ['run', 'ci-backend-unit-test'], { cwd: projectDir });
    const pathBackendUnit = path.resolve(projectDir, 's4hana_pipeline', 'reports', 'backend-unit');
    expect(fs.readdirSync(pathBackendUnit).length).not.toBe(0);

  }, 60000);

  it('should add necessary files to an existing project', async () => {
    const expressAppDir = 'test/express/';
    const projectDir = path.resolve(pathPrefix, 'add-to-existing');

    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }
    fs.copySync(expressAppDir, projectDir, { recursive: true });

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', '--skipFrontendScripts', `--projectDir=${projectDir}`, '--force'];
    await Init.run(argv);
    ['.npmrc', 'credentials.json', 'systems.json', 'manifest.yml']
      .map(file => path.resolve(projectDir, file))
      .forEach(path => {
        expect(fs.existsSync(path)).toBe(true);
      });
  }, 20000);

  it('init should detect and ask if there are conflicts', async () => {
    const projectDir = path.resolve(pathPrefix, 'detect-conflicts');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    fs.createFileSync(`${projectDir}/.npmrc`);

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', '--frontendScripts', '--initWithExpress', `--projectDir=${projectDir}`];
    await Init.run(argv);

    expect(confirm).toHaveBeenCalledWith('File(s) ".npmrc" already exist(s). Should they be overwritten?');
  }, 60000);

  it('should add to gitignore if there is one', async () => {
    const exampleAppDir = 'test/nest/';
    const projectDir = path.resolve(pathPrefix, 'add-to-gitignore');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }
    fs.copySync(exampleAppDir, projectDir, { recursive: true });

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', '--skipFrontendScripts', `--projectDir=${projectDir}`];
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

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', '--skipFrontendScripts', `--projectDir=${projectDir}`];
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
    expect(scripts).toContain('ci-build');
    expect(scripts).toContain('ci-package');
    expect(scripts).toContain('ci-backend-unit-test');
    expect(scripts).toContain('ci-frontend-unit-test');
    expect(scripts).toContain('ci-integration-test');
    expect(scripts).toContain('ci-e2e');
  }, 20000);
});
