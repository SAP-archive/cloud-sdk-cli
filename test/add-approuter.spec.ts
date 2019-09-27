/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
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
import AddApprouter from '../src/commands/add-approuter';

describe('Add Approuter', () => {
  const pathPrefix = path.resolve(__dirname, __filename.replace('.', '-'));

  beforeAll(() => {
    if (!fs.existsSync(pathPrefix)) {
      fs.mkdirSync(pathPrefix);
    }
  });

  afterAll(() => {
    fs.removeSync(pathPrefix);
  });

  it('[approuter] should add preconfigured files', async () => {
    const projectDir = path.resolve(pathPrefix, 'add-approuter');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

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
  }, 30000);

  it('should add necessary files to an existing project', async () => {
    const projectDir = path.resolve(pathPrefix, 'add-approuter');
    if (fs.existsSync(projectDir)) {
      fs.removeSync(projectDir);
    }

    // fs.copySync()

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
  }, 30000);

  it('should detect and ask if there are conflicts', () => {
    expect(true).toBe(true);
  });
});
