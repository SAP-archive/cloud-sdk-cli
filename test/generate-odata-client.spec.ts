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
jest.retryTimes(3);

import * as fs from 'fs-extra';
import * as path from 'path';
import GenerateODataClient from '../src/commands/generate-odata-client';
import { generatorOptionsSDK, GeneratorOptionsSDK } from '../src/utils';
import { deleteAsync, TimeThresholds } from './test-utils';

describe('generate-odata-client', () => {
  const pathForTests = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

  beforeAll(async () => {
    await deleteAsync(pathForTests, 3);
    const pathForResources = path.resolve(__dirname, 'resources', 'template-generator-odata-client');
    await fs.copy(pathForResources, pathForTests);
  }, TimeThresholds.LONG);

  afterAll(async () => {
    await deleteAsync(pathForTests, 3);
  }, TimeThresholds.LONG);

  it(
    'should fail if the mandatory parameters are not there',
    async done => {
      GenerateODataClient.run([])
        .then(() => {
          throw new Error('Should not resolve.');
        })
        .catch(err => {
          expect(err.message).toMatch('-i, --inputDir INPUTDIR');
          done();
        });
    },
    TimeThresholds.MEDIUM
  );

  it(
    'should install and generate',
    async done => {
      await GenerateODataClient.run(['-i=input', '-o=output', '--projectDir', pathForTests]);

      expect(execa).toHaveBeenCalledTimes(3);
      expect(execa.mock.calls[1][1].sort()).toContain('@sap-cloud-sdk/generator');
      expect(execa.mock.calls[2][1].sort()).toEqual(getDefault(pathForTests).sort());
      done();
    },
    TimeThresholds.MEDIUM
  );
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
