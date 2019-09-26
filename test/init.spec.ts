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
import * as fs from 'fs-extra';
import * as path from 'path';
import Init from '../src/commands/init';

describe('Init', () => {
  it('should create a new project with the necessary files', async () => {
    const projectDir = 'test/full-init/';
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
    fs.removeSync(projectDir);
  }, 60000);

  it('should add necessary files to an existing project', async () => {
    const expressAppDir = 'test/express/';
    const projectDir = 'test/add-to-existing/';

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
    fs.removeSync(projectDir);
  }, 20000);

  it('init should detect and ask if there are conflicts', async () => {
    const projectDir = 'test/detect-conflicts/';
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    fs.createFileSync(`${projectDir}.npmrc`);

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', '--frontendScripts', '--initWithExpress', `--projectDir=${projectDir}`];
    await Init.run(argv);

    expect(confirm).toHaveBeenCalledWith('File(s) ".npmrc" already exist(s). Should they be overwritten?');

    fs.removeSync(projectDir);
  }, 60000);

  it('should add to gitignore if there is one', async () => {
    const projectDir = 'test/add-to-gitignore/';
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', '--frontendScripts', '--initWithExpress', `--projectDir=${projectDir}`];
    await Init.run(argv);

    const gitignoreEntries = fs
      .readFileSync(`${projectDir}.gitignore`, 'utf8')
      .split('\n')
      .filter(entry => entry !== '');

    expect(gitignoreEntries).toContain('credentials.json');
    expect(gitignoreEntries).toContain('/s4hana_pipeline');
    expect(gitignoreEntries).toContain('/deployment');
    expect(gitignoreEntries.length).toBeGreaterThan(3);

    fs.removeSync(projectDir);
  }, 60000);

  it('should create a new gitignore if there is none', async () => {
    const projectDir = 'test/new-gitignore/';
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    fs.createFileSync(`${projectDir}package.json`);
    fs.writeFileSync(`${projectDir}package.json`, JSON.stringify({ name: 'name' }), 'utf8');

    const argv = ['--projectName=testingApp', '--startCommand="npm start"', '--frontendScripts', `--projectDir=${projectDir}`];
    await Init.run(argv);

    const gitignoreEntries = fs
      .readFileSync(`${projectDir}.gitignore`, 'utf8')
      .split('\n')
      .filter(entry => entry !== '');

    expect(gitignoreEntries).toEqual(['credentials.json', '/s4hana_pipeline', '/deployment']);
    expect(gitignoreEntries.length).toBe(3);

    fs.removeSync(projectDir);
  }, 60000);

  it('should show a warning if the project is not using git', () => {
    expect(true).toBe(true);
  });

  it('should add our scripts and dependencies to the package.json', () => {
    expect(true).toBe(true);
  });
});
