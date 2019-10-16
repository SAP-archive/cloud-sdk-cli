export enum InitializationType {
  freshExpress,
  existingProject
}

interface backendTestScripts {
  'ci-backend-unit-test': string,
  'ci-integration-test': string,
  test?:string
}

interface devDependencies {
  [name: string]: string
}


const expressPackageJsonParts: packageJsonParts = {
  backendTestScripts: {
    'ci-integration-test': 'jest --ci --config=jest.integration-test.config.js',
    'ci-backend-unit-test': 'jest --ci --config=jest.unit-test.config.js',
    'test': "jest",
  },
  devDependencies: {
    "jest": "^24.9.0",
    "ts-jest": "^24.0.2",
    "@types/jest": "^24.0.18",
    "ts-node": "^8.3.0",
    "tslint": "^5.18.0",
    "typescript": "^3.5.3",
    "jest-junit":"^8.0.0"
  }
};

const userDefinedJsonParts: packageJsonParts = {
  backendTestScripts: {
    'ci-integration-test': 'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-integration/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-integration/`"',
    'ci-backend-unit-test': 'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-unit/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-unit/`"',
  },
  devDependencies: {}
};

interface packageJsonParts {
  backendTestScripts: backendTestScripts,
  devDependencies: devDependencies
}

export namespace InitTypeHelper {
  export function packageJsonParts(type: InitializationType): packageJsonParts {
    switch (type) {
      case InitializationType.freshExpress:
        return expressPackageJsonParts;
      case InitializationType.existingProject:
        return userDefinedJsonParts;
    }
  }
}

