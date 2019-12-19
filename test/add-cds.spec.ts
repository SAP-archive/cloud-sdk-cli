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
import AddCds from '../src/commands/add-cds';
import { getPathPrefix, removeDir } from './test-utils';

describe('Add CDS', () => {
  const pathPrefix = getPathPrefix(__dirname, __filename);

  beforeAll(() => {
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix, { recursive: true });
    }
  });

  afterAll(() => {
    fs.removeSync(pathPrefix);
  });

  it('should add preconfigured files', async () => {
    const projectDir = path.resolve(pathPrefix, 'add-cds');
    removeDir(projectDir);

    const argv = [`--projectDir=${projectDir}`];
    await AddCds.run(argv);

    const files = fs.readdirSync(projectDir);
    expect(files).toIncludeAllMembers(['.cdsrc.json', 'db', 'srv']);

    const dbFiles = fs.readdirSync(path.resolve(projectDir, 'db'));
    expect(dbFiles).toContain('data-model.cds');
    const srvFiles = fs.readdirSync(path.resolve(projectDir, 'srv'));
    expect(srvFiles).toContain('cat-service.cds');
  }, 30000);

  it('should add necessary files to an existing project', async () => {
    const projectDir = path.resolve(pathPrefix, 'add-cds-to-existing-project');
    removeDir(projectDir);

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });

    const argv = [`--projectDir=${projectDir}`];
    await AddCds.run(argv);

    const files = fs.readdirSync(projectDir);

    expect(files).toIncludeAllMembers(['.cdsrc.json', 'db', 'srv']);

    const dbFiles = fs.readdirSync(path.resolve(projectDir, 'db'));
    expect(dbFiles).toContain('data-model.cds');
    const srvFiles = fs.readdirSync(path.resolve(projectDir, 'srv'));
    expect(srvFiles).toContain('cat-service.cds');
  }, 30000);

  it('should detect and fail if there are conflicts', async () => {
    const projectDir = path.resolve(pathPrefix, 'add-cds-conflicts');
    removeDir(projectDir);

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });
    fs.mkdirSync(path.resolve(projectDir, 'db'));
    fs.createFileSync(path.resolve(projectDir, 'db', 'data-model.cds'));
    fs.writeFileSync(path.resolve(projectDir, 'db', 'data-model.cds'), 'some text', 'utf8');

    const argv = [`--projectDir=${projectDir}`];
    await AddCds.run(argv);

    expect(error).toHaveBeenCalledWith(
      'A file with the name "data-model.cds" already exists. If you want to overwrite it, rerun the command with `--force`.',
      {
        exit: 1
      }
    );
  }, 30000);
});
