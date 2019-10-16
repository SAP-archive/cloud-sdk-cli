interface testFileInfo {
  fileName: string,
  targetFolder: string
}

export const testFiles: testFileInfo[] = [
  {
    fileName: 'sample-unit-test.spec.ts',
    targetFolder: 'unit-tests'
  }, {
    fileName: 'sample-integration-test.spec.ts',
    targetFolder: 'integration-tests'
  }
];
