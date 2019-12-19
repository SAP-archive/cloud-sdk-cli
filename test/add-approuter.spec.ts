/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

const prompt = jest.fn().mockResolvedValue('mock-project');
const error = jest.fn();
jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      prompt,
      error
    }
  };
});

import * as fs from 'fs-extra';
import * as path from 'path';
import AddApprouter from '../src/commands/add-approuter';
import { getCleanProjectDir, getPathPrefix } from './test-utils';

describe('Add Approuter', () => {
  const pathPrefix = getPathPrefix(__dirname, __filename);

  afterAll(() => {
    fs.removeSync(pathPrefix);
  });

  it('should add preconfigured files', async () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'add-approuter');

    const argv = [`--projectDir=${projectDir}`];
    await AddApprouter.run(argv);

    const files = fs.readdirSync(projectDir);
    expect(files).toContain('approuter');

    const approuterFiles = fs.readdirSync(path.resolve(projectDir, 'approuter'));
    expect(approuterFiles).toContain('.npmrc');
    expect(approuterFiles).toContain('manifest.yml');
    expect(approuterFiles).toContain('package.json');
    expect(approuterFiles).toContain('xs-app.json');
    expect(approuterFiles).toContain('xs-security.json');
  });

  it('should add necessary files to an existing project', async () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'add-approuter-to-existing-project');

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });

    const argv = [`--projectDir=${projectDir}`];
    await AddApprouter.run(argv);

    const files = fs.readdirSync(projectDir);
    expect(files).toContain('approuter');

    const approuterFiles = fs.readdirSync(path.resolve(projectDir, 'approuter'));
    expect(approuterFiles).toContain('.npmrc');
    expect(approuterFiles).toContain('manifest.yml');
    expect(approuterFiles).toContain('package.json');
    expect(approuterFiles).toContain('xs-app.json');
    expect(approuterFiles).toContain('xs-security.json');
  });

  it('should detect and fail if there are conflicts', async () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'add-approuter-conflicts');

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });
    fs.mkdirSync(path.resolve(projectDir, 'approuter'));
    fs.createFileSync(path.resolve(projectDir, 'approuter', 'xs-security.json'));
    fs.writeFileSync(path.resolve(projectDir, 'approuter', 'xs-security.json'), JSON.stringify({ 'tenant-mode': 'shared' }), 'utf8');

    const argv = [`--projectDir=${projectDir}`];
    await AddApprouter.run(argv);

    expect(error).toHaveBeenCalledWith(
      'A file with the name "xs-security.json" already exists. If you want to overwrite it, rerun the command with `--force`.',
      {
        exit: 1
      }
    );
  });
});
