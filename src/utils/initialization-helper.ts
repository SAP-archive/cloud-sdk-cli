/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

export enum InitializationType {
  freshExpress,
  existingProject
}

interface BackendTestScripts {
  'ci-backend-unit-test': string;
  'ci-integration-test': string;
  test?: string;
}

interface DevDependencies {
  [name: string]: string;
}

const expressPackageJsonParts: PackageJsonParts = {
  backendTestScripts: {
    'ci-integration-test': 'jest --ci --config=jest.integration-test.config.js',
    'ci-backend-unit-test': 'jest --ci --config=jest.unit-test.config.js',
    test: 'jest'
  },
  devDependencies: {
    jest: '^24.9.0',
    'jest-junit': '^8.0.0'
  }
};

const userDefinedJsonParts: PackageJsonParts = {
  backendTestScripts: {
    'ci-integration-test':
      'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-integration/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-integration/`"',
    'ci-backend-unit-test':
      'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-unit/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-unit/`"'
  },
  devDependencies: {}
};

interface PackageJsonParts {
  backendTestScripts: BackendTestScripts;
  devDependencies: DevDependencies;
}

export function packageJsonParts(type: InitializationType): PackageJsonParts {
  switch (type) {
    case InitializationType.freshExpress:
      return expressPackageJsonParts;
    case InitializationType.existingProject:
      return userDefinedJsonParts;
  }
}
