/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import AddCxServer from '../src/commands/add-cx-server';
import { deleteAsync, getCleanProjectDir, getTestOutputDir, TimeThresholds } from './test-utils';

describe('Add CX Server', () => {
  const testOutputDir = getTestOutputDir(__filename);

  beforeAll(async () => {
    await deleteAsync(testOutputDir, 3);
  }, TimeThresholds.SHORT);

  it(
    'should add the necessary files',
    async () => {
      const projectDir = await getCleanProjectDir(testOutputDir, 'add-cx-server');

      await AddCxServer.run([projectDir]);

      const files = fs.readdir(projectDir);
      const approuterFiles = fs.readdir(path.resolve(projectDir, 'cx-server'));

      return Promise.all([files, approuterFiles]).then(values => {
        expect(values[0]).toContain('cx-server');
        expect(values[1]).toIncludeAllMembers(['cx-server', 'server.cfg']);
      });
    },
    TimeThresholds.SHORT
  );

  it(
    'should add the necessary files on windows',
    async () => {
      const projectDir = await getCleanProjectDir(testOutputDir, 'add-cx-server');

      await AddCxServer.run([projectDir, '--platform=win32']);

      const files = fs.readdir(projectDir);
      const approuterFiles = fs.readdir(path.resolve(projectDir, 'cx-server'));

      return Promise.all([files, approuterFiles]).then(values => {
        expect(values[0]).toContain('cx-server');
        expect(values[1]).toIncludeAllMembers(['cx-server', 'cx-server.bat', 'server.cfg']);
      });
    },
    TimeThresholds.SHORT
  );

  it(
    'should add necessary files to an existing project',
    async () => {
      const projectDir = await getCleanProjectDir(testOutputDir, 'add-cx-server-to-existing-project');

      await fs.copy(path.resolve(__dirname, 'express'), projectDir, { recursive: true });

      await AddCxServer.run([projectDir]);

      const files = fs.readdir(projectDir);
      const approuterFiles = fs.readdir(path.resolve(projectDir, 'cx-server'));

      return Promise.all([files, approuterFiles]).then(values => {
        expect(values[0]).toContain('cx-server');
        expect(values[1]).toIncludeAllMembers(['cx-server', 'server.cfg']);
      });
    },
    TimeThresholds.SHORT
  );

  it(
    'should detect and fail if there are conflicts',
    async () => {
      const projectDir = await getCleanProjectDir(testOutputDir, 'add-cx-server-conflicts');

      await fs.mkdir(path.resolve(projectDir, 'cx-server'));
      await fs.createFile(path.resolve(projectDir, 'cx-server', 'cx-server'));

      try {
        await AddCxServer.run([projectDir]);
      } catch (e) {
        expect(e.message).toContain('A file with the name "cx-server" already exists.');
      }
    },
    TimeThresholds.SHORT
  );
});
