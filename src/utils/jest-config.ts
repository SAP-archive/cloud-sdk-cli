/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */

import { recordWarning, readFile, writeFile } from '../utils';

function getJestConfig(isUnitTests: boolean) {
  return {
    reporters: [
      'default',
      [
        'jest-junit',
        {
          suiteName: 'backend unit tests',
          outputDirectory: `./s4hana_pipeline/reports/backend-${
            isUnitTests ? 'unit' : 'integration'
          }`
        }
      ]
    ],
    collectCoverage: true,
    coverageReporters: ['text', 'cobertura'],
    coverageDirectory: `../s4hana_pipeline/reports/coverage-reports/backend-${
      isUnitTests ? 'unit' : 'integration'
    }`
  };
}

export const integrationTestConfig = getJestConfig(false);

export const unitTestConfig = getJestConfig(true);

export async function modifyJestConfig(
  jestConfigPath: string,
  data: any
): Promise<void> {
  try {
    const jestConfig = JSON.parse(
      await readFile(jestConfigPath, {
        encoding: 'utf8'
      })
    );
    const adjustedJestConfig = {
      ...jestConfig,
      ...data
    };

    return writeFile(
      jestConfigPath,
      JSON.stringify(adjustedJestConfig, null, 2)
    );
  } catch (error) {
    recordWarning(
      `Could not edit your Jest config at "${jestConfigPath}".`,
      'Please verify if the location is correct and consider opening a bug ticket',
      'at https://github.com/SAP/cloud-sdk-cli'
    );
  }
}
