/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import exp = require('constants');

const prompt = jest.fn().mockResolvedValue('mock-project');
jest.mock('cli-ux', () => {
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      prompt
    }
  };
});
import * as fs from 'fs-extra';
import * as path from 'path';
import AddApprouter from '../src/commands/add-approuter';
import { deleteAsync, getCleanProjectDir, getTestOutputDir } from './test-utils';

describe('Add Approuter', () => {
  const testOutputDir = getTestOutputDir(__filename);

  beforeAll(async () => {
    await deleteAsync(testOutputDir, 3);
  });

  afterAll(async () => {
    await deleteAsync(testOutputDir, 3);
  });

  it('should add preconfigured files', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'add-approuter');

    await AddApprouter.run([projectDir]);

    const files = fs.readdir(projectDir);
    const approuterFiles = fs.readdir(path.resolve(projectDir, 'approuter'));

    return Promise.all([files, approuterFiles]).then(values => {
      expect(values[0]).toContain('approuter');
      expect(values[1]).toIncludeAllMembers(['.npmrc', 'manifest.yml', 'package.json', 'xs-app.json', 'xs-security.json']);
    });
  }, 10000);

  it('should add necessary files to an existing project', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'add-approuter-to-existing-project');

    await fs.copy(path.resolve(__dirname, 'express'), projectDir, { recursive: true });

    await AddApprouter.run([projectDir]);

    const files = fs.readdir(projectDir);
    const approuterFiles = fs.readdir(path.resolve(projectDir, 'approuter'));

    return Promise.all([files, approuterFiles]).then(values => {
      expect(values[0]).toContain('approuter');
      expect(values[1]).toIncludeAllMembers(['.npmrc', 'manifest.yml', 'package.json', 'xs-app.json', 'xs-security.json']);
    });
  }, 10000);

  it('should detect and fail if there are conflicts', async () => {
    const projectDir = await getCleanProjectDir(testOutputDir, 'add-approuter-conflicts');

    await fs.copy(path.resolve(__dirname, 'express'), projectDir, { recursive: true });
    await fs.mkdir(path.resolve(projectDir, 'approuter'));
    await fs.createFile(path.resolve(projectDir, 'approuter', 'xs-security.json'));
    await fs.writeFile(path.resolve(projectDir, 'approuter', 'xs-security.json'), JSON.stringify({ 'tenant-mode': 'shared' }), 'utf8');

    try {
      await AddApprouter.run([projectDir]);
    } catch (e) {
      expect(e.message).toMatch(/A file with the name .* already exists\./);
    }
  }, 10000);
});
