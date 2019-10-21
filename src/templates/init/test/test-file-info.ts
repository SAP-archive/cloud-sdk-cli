interface testFileInfo {
  fileName: string;
  targetFolder: string;
}

export const testFiles: testFileInfo[] = [
  {
    fileName: 'sample-unit-test.spec.js',
    targetFolder: 'test/unit-tests'
  },
  {
    fileName: 'sample-integration-test.spec.js',
    targetFolder: 'test/integration-tests'
  }
];
