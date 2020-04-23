module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  modulePathIgnorePatterns: [
    '<rootDir>/lib',
    '<rootDir>/bin',
    '<rootDir>/tmp',
    '<rootDir>/test/nest',
    '<rootDir>/test/express',
    '<rootDir>/test/[^/]*/[^/]*-spec'
  ],
  setupFilesAfterEnv: ['jest-extended'],
  roots: ['test'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    }
  }
};
