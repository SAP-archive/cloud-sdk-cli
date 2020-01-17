/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

const prompt = jest.fn().mockResolvedValue('mock-project');
jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
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
import AddCds from '../src/commands/add-cds';
import { getCleanProjectDir, getTestOutputDir } from './test-utils';

describe('Add CDS', () => {
  const testOutputDir = getTestOutputDir(__filename);

  afterAll(() => {
    fs.removeSync(testOutputDir);
  });

  it('should add necessary files to an existing project', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'add-cds-to-existing-project');

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });

    await AddCds.run([projectDir, '--skipInstall']);

    const files = fs.readdirSync(projectDir);

    expect(files).toIncludeAllMembers(['.cdsrc.json', 'db', 'srv']);

    const dbFiles = fs.readdirSync(path.resolve(projectDir, 'db'));
    expect(dbFiles).toContain('data-model.cds');
    const srvFiles = fs.readdirSync(path.resolve(projectDir, 'srv'));
    expect(srvFiles).toContain('cat-service.cds');
  }, 15000);

  it('should detect and fail if there are conflicts', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'add-cds-conflicts');

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });
    fs.mkdirSync(path.resolve(projectDir, 'db'));
    fs.createFileSync(path.resolve(projectDir, 'db', 'data-model.cds'));
    fs.writeFileSync(path.resolve(projectDir, 'db', 'data-model.cds'), 'some text', 'utf8');

    await expect(AddCds.run([projectDir, '--skipInstall'])).rejects.toMatchSnapshot();
  });
});
