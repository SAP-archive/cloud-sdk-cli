module.exports = {
  roots: ['test/integration-tests'],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 's4hana_pipeline/reports/backend-integration/' }]
  ]
};
