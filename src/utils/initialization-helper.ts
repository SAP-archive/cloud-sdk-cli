/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

export enum InitType {
  buildScaffold,
  existingProject
}

interface BackendTestScripts {
  'ci-backend-unit-test': string;
  'ci-integration-test': string;
  'test'?: string;
}

interface BackendBuildScripts {
  'ci-build': string;
  'ci-package': string;
}

interface FrontendScripts {
  'ci-e2e': string;
  'ci-frontend-unit-test': string;
}

interface SharedScripts {
  frontendScripts: FrontendScripts;
  backendBuildScripts: BackendBuildScripts;
}

const sharedScriptsForTypes: SharedScripts = {
  frontendScripts: {
    'ci-e2e': 'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/e2e/`"',
    'ci-frontend-unit-test':
      'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-integration/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-integration/`"'
  },
  backendBuildScripts: {
    'ci-build': 'echo "Use this to compile or minify your application"',
    'ci-package': 'echo "Copy all deployment-relevant files to the `deployment` folder"'
  }
};

const expressPackageJsonParts: PackageJsonParts = {
  ...sharedScriptsForTypes,
  backendTestScripts: {
    'ci-integration-test': 'jest --ci --config=jest.integration-test.config.js',
    'ci-backend-unit-test': 'jest --ci --config=jest.unit-test.config.js'
  },
  devDependencies: ['jest', 'jest-junit', '@sap/cloud-sdk-test-util'],
  dependencies: ['@sap/cloud-sdk-core']
};

const userDefinedJsonParts: PackageJsonParts = {
  ...sharedScriptsForTypes,
  backendTestScripts: {
    'ci-integration-test':
      'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-integration/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-integration/`"',
    'ci-backend-unit-test':
      'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-unit/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-unit/`"'
  },
  devDependencies: ['@sap/cloud-sdk-test-util'],
  dependencies: ['@sap/cloud-sdk-core']
};

interface PackageJsonParts {
  backendBuildScripts: BackendBuildScripts;
  frontendScripts: FrontendScripts;
  backendTestScripts: BackendTestScripts;
  devDependencies: string[];
  dependencies: string[];
}

export function packageJsonParts(type: InitType): PackageJsonParts {
  switch (type) {
    case InitType.buildScaffold:
      return expressPackageJsonParts;
    case InitType.existingProject:
      return userDefinedJsonParts;
  }
}
