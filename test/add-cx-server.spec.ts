/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

const error = jest.fn();
jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      error
    }
  };
});

import * as fs from 'fs-extra';
import * as path from 'path';
import AddCxServer from '../src/commands/add-cx-server';

describe('Add CX Server', () => {
  const pathPrefix = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

  beforeAll(() => {
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix, { recursive: true });
    }
  });

  afterAll(() => {
    fs.removeSync(pathPrefix);
  });

  it('should add the necessary files', async () => {
    const projectDir = path.resolve(pathPrefix, 'add-cx-server');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    const argv = [`--projectDir=${projectDir}`];
    await AddCxServer.run(argv);

    const files = fs.readdirSync(projectDir);
    expect(files).toContain('cx-server');

    const approuterFiles = fs.readdirSync(path.resolve(projectDir, 'cx-server'));
    expect(approuterFiles).toContain('cx-server');
    expect(approuterFiles).toContain('server.cfg');
  }, 30000);

  it('should add the necessary files on windows', async () => {
    const projectDir = path.resolve(pathPrefix, 'add-cx-server');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    const argv = [`--projectDir=${projectDir}`, '--platform=win32'];
    await AddCxServer.run(argv);

    const files = fs.readdirSync(projectDir);
    expect(files).toContain('cx-server');

    const approuterFiles = fs.readdirSync(path.resolve(projectDir, 'cx-server'));
    expect(approuterFiles).toContain('cx-server');
    expect(approuterFiles).toContain('cx-server.bat');
    expect(approuterFiles).toContain('server.cfg');
  }, 30000);

  it('should add necessary files to an existing project', async () => {
    const projectDir = path.resolve(pathPrefix, 'add-cx-server-to-existing-project');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });

    const argv = [`--projectDir=${projectDir}`];
    await AddCxServer.run(argv);

    const files = fs.readdirSync(projectDir);
    expect(files).toContain('cx-server');

    const approuterFiles = fs.readdirSync(path.resolve(projectDir, 'cx-server'));
    expect(approuterFiles).toContain('cx-server');
    expect(approuterFiles).toContain('server.cfg');
  }, 30000);

  it('should detect and fail if there are conflicts', async () => {
    const projectDir = path.resolve(pathPrefix, 'add-cx-server-conflicts');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    fs.mkdirSync(path.resolve(projectDir, 'cx-server'), { recursive: true });
    fs.createFileSync(path.resolve(projectDir, 'cx-server', 'cx-server'));

    const argv = [`--projectDir=${projectDir}`];
    await AddCxServer.run(argv);

    expect(error).toHaveBeenCalledWith(
      'A file with the name "cx-server" already exists. If you want to overwrite it, rerun the command with `--force`.',
      {
        exit: 1
      }
    );
  }, 30000);
});
