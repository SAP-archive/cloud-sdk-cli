/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

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
import { getCleanProjectDir, getTestOutputDir } from './test-utils';

describe('Add Approuter', () => {
  const testOutputDir = getTestOutputDir(__filename);

  afterAll(() => {
    fs.removeSync(testOutputDir);
  });

  it('should add preconfigured files', async () => {
    const projectDir = getCleanProjectDir(testOutputDir, 'add-approuter');

    await AddApprouter.run([projectDir]);

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
    const projectDir = getCleanProjectDir(testOutputDir, 'add-approuter-to-existing-project');

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });

    await AddApprouter.run([projectDir]);

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
    const projectDir = getCleanProjectDir(testOutputDir, 'add-approuter-conflicts');

    fs.copySync(path.resolve(__dirname, 'express'), projectDir, { recursive: true });
    fs.mkdirSync(path.resolve(projectDir, 'approuter'));
    fs.createFileSync(path.resolve(projectDir, 'approuter', 'xs-security.json'));
    fs.writeFileSync(path.resolve(projectDir, 'approuter', 'xs-security.json'), JSON.stringify({ 'tenant-mode': 'shared' }), 'utf8');

    await expect(AddApprouter.run([projectDir])).rejects.toMatchSnapshot();
  });
});
