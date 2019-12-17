module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    '<rootDir>/lib',
    '<rootDir>/bin',
    '<rootDir>/tmp',
    '<rootDir>/test/nest',
    '<rootDir>/test/express',
    '<rootDir>/test/[^/]*/[^/]*-spec'
  ],
  roots: ['test']
};
