/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
const execa = jest.fn().mockRejectedValueOnce({ exitCode: 1 }).mockResolvedValueOnce('installed').mockResolvedValueOnce('generated');
jest.mock('execa', () => execa);
jest.mock('cli-ux', () => ({
  default: {
    confirm: jest.fn().mockResolvedValue(true)
  }
}));

import * as fs from 'fs-extra';
import * as path from 'path';
import * as rm from 'rimraf';
import GenerateODataClient from '../src/commands/generate-odata-client';
import { generatorOptionsSDK, GeneratorOptionsSDK } from '../src/utils';

describe('generate-odata-client', () => {
  const pathForTests = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

  beforeAll(() => {
    rm.sync(pathForTests);
    const pathForResources = path.resolve(__dirname, 'resources', 'template-generator-odata-client');
    fs.copySync(pathForResources, pathForTests);
  });

  afterAll(() => {
    rm.sync(pathForTests);
  });

  it('should fail if the mandatory parameters are not there', async () => {
    try {
      await GenerateODataClient.run([]);
    } catch (e) {
      expect(e.message).toMatch('-i, --inputDir INPUTDIR');
    }
  });

  it('should install and generate', async () => {
    await GenerateODataClient.run(['-i=input', '-o=output', '--projectDir', pathForTests]);

    expect(execa).toHaveBeenCalledTimes(3);
    expect(execa.mock.calls[1][1].sort()).toContain('@sap-cloud-sdk/generator');
    expect(execa.mock.calls[2][1].sort()).toEqual(getDefault(pathForTests).sort());
  });
});

function getDefault(projectDir: string) {
  return [
    ...Object.keys(generatorOptionsSDK).reduce((prev, current) => {
      const value = generatorOptionsSDK[current as keyof GeneratorOptionsSDK];
      return value && typeof value.default !== 'undefined' ? [...prev, `--${current}=${value.default}`] : prev;
    }, [] as any),
    `--inputDir=${path.resolve(projectDir, 'input')}`,
    `--outputDir=${path.resolve(projectDir, 'output')}`
  ];
}
