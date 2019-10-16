module.exports = {
  transform: {"^.+\\.tsx?$": "ts-jest"},
  testRegex:"/unit-tests/.*(test|spec).*",
  reporters: [
    'default',
    [ "jest-junit", { suiteName: "jest tests",outputDirectory:"s4hana_pipeline/reports/backend-unit/" } ]
  ]
}
