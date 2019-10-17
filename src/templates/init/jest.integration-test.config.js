module.exports = {
  roots: ["integration-tests"],
  reporters: [
    'default',
    [ "jest-junit", { suiteName: "jest tests",outputDirectory:"s4hana_pipeline/reports/backend-integration/" } ]
  ]
}
