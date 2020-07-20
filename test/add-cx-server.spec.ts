/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import * as rm from 'rimraf';
import * as fs from 'fs-extra';
import * as path from 'path';
import AddCxServer from '../src/commands/add-cx-server';
import { getCleanProjectDir, getTestOutputDir } from './test-utils';

describe('Add CX Server', () => {
  const testOutputDir = getTestOutputDir(__filename);

  beforeAll(() => {
    rm.sync(testOutputDir);
  });

  afterAll(() => {
    rm.sync(testOutputDir);
  });

  it('should add the necessary files', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'add-cx-server');

    await AddCxServer.run([projectDir]);

    const files = fs.readdirSync(projectDir);
    expect(files).toContain('cx-server');

    const approuterFiles = fs.readdirSync(path.resolve(projectDir, 'cx-server'));
    expect(approuterFiles).toIncludeAllMembers(['cx-server', 'server.cfg']);
  },10000);

  it('should add the necessary files on windows', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'add-cx-server');

    await AddCxServer.run([projectDir, '--platform=win32']);

    const files = fs.readdirSync(projectDir);
    expect(files).toContain('cx-server');

    const approuterFiles = fs.readdirSync(path.resolve(projectDir, 'cx-server'));
    expect(approuterFiles).toIncludeAllMembers(['cx-server', 'cx-server.bat', 'server.cfg']);
  },10000);

  it('should add necessary files to an existing project', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'add-cx-server-to-existing-project');

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });

    await AddCxServer.run([projectDir]);

    const files = fs.readdirSync(projectDir);
    expect(files).toContain('cx-server');

    const approuterFiles = fs.readdirSync(path.resolve(projectDir, 'cx-server'));
    expect(approuterFiles).toIncludeAllMembers(['cx-server', 'server.cfg']);
  }, 10000);

  it('should detect and fail if there are conflicts', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'add-cx-server-conflicts');

    fs.mkdirSync(path.resolve(projectDir, 'cx-server'), { recursive: true });
    fs.createFileSync(path.resolve(projectDir, 'cx-server', 'cx-server'));

    await expect(AddCxServer.run([projectDir])).rejects.toMatchSnapshot();
  },10000);
});
