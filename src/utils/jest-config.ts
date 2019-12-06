/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import cli from 'cli-ux';
import * as fs from 'fs';

export function getJestConfig(isUnitTests: boolean) {
  return {
    reporters: [
      'default',
      [
        'jest-junit',
        {
          suiteName: 'backend unit tests',
          outputDirectory: `./s4hana_pipeline/reports/backend-${isUnitTests ? 'unit' : 'integration'}`
        }
      ]
    ],
    collectCoverage: true,
    coverageReporters: ['text', 'cobertura'],
    coverageDirectory: `../s4hana_pipeline/reports/coverage-reports/backend-${isUnitTests ? 'unit' : 'integration'}`
  };
}

export function modifyJestConfig(jestConfigPath: string, data: any) {
  try {
    const jestConfig = JSON.parse(
      fs.readFileSync(jestConfigPath, {
        encoding: 'utf8'
      })
    );
    const adjustedJestConfig = {
      ...jestConfig,
      ...data
    };

    fs.writeFileSync(jestConfigPath, JSON.stringify(adjustedJestConfig, null, 2));
  } catch (error) {
    cli.warn(error);
    return cli.warn(
      `Could not edit your Jest config at "${jestConfigPath}". Please verify if the location is correct and consider opening a bug ticket at github.com/SAP/cloud-sdk-cli`
    );
  }
}
