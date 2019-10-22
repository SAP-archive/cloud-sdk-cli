module.exports = {
  roots: ['test/unit-tests'],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 's4hana_pipeline/reports/backend-unit/' }]
  ]
};
