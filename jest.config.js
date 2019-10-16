module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/lib', '<rootDir>/bin', '<rootDir>/tmp', '<rootDir>/test/nest', '<rootDir>/test/express'],
  transform: {"^.+\\.tsx?$": "ts-jest"},
  reporters: [
    'default',
    [ "jest-junit", { suiteName: "jest tests" } ]
  ]
};
