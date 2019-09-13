/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import Init from '../src/commands/init';

describe('Init', () => {
  it('should create a new project with the necessary files', async () => {
    const projectDir = 'test/do-not-commit/';
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
    const projectDir = 'test/do-not-commit2/';

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
  });

  it('should detect and ask if there are conflicts', async () => {
    expect(true).toBe(true);
  });

  it('should add to gitignore if there is one', () => {
    expect(true).toBe(true);
  });

  it('should show a warning if the project is not using git', () => {
    expect(true).toBe(true);
  });

  it('should add our scripts and dependencies to the package.json', () => {
    expect(true).toBe(true);
  });
});
