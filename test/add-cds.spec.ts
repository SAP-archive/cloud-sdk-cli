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
import { getCleanProjectDir, getPathPrefix } from './test-utils';

describe('Add CDS', () => {
  const pathPrefix = getPathPrefix(__dirname, __filename);

  afterAll(() => {
    fs.removeSync(pathPrefix);
  });

  it('should add necessary files to an existing project', async () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'add-cds-to-existing-project');

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });

    await AddCds.run([projectDir, '--skipInstall']);

    const files = fs.readdirSync(projectDir);

    expect(files).toIncludeAllMembers(['.cdsrc.json', 'db', 'srv']);

    const dbFiles = fs.readdirSync(path.resolve(projectDir, 'db'));
    expect(dbFiles).toContain('data-model.cds');
    const srvFiles = fs.readdirSync(path.resolve(projectDir, 'srv'));
    expect(srvFiles).toContain('cat-service.cds');
  }, 10000);

  it('should detect and fail if there are conflicts', async () => {
    const projectDir = getCleanProjectDir(pathPrefix, 'add-cds-conflicts');

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });
    fs.mkdirSync(path.resolve(projectDir, 'db'));
    fs.createFileSync(path.resolve(projectDir, 'db', 'data-model.cds'));
    fs.writeFileSync(path.resolve(projectDir, 'db', 'data-model.cds'), 'some text', 'utf8');

    await AddCds.run([projectDir, '--skipInstall']);

    expect(error).toHaveBeenCalledWith(
      'A file with the name "data-model.cds" already exists. If you want to overwrite it, rerun the command with `--force`.',
      {
        exit: 1
      }
    );
  }, 10000);
});
