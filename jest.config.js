module.exports = {
  testEnvironment: "node",
  roots: [
    "<rootDir>/test",
    "<rootDir>/e2e",
  ],
  testMatch: ["**/*.test.ts","**/*.e2e.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: [
    "**.{ts,tsx}",
    "*.{ts,tsx}",
    "**/*.{ts,tsx}",
    "**/**/*.{ts,tsx}",
    "!**/script/**",
    "!**/node_modules/**",
    "!**/my_modules/**",
    "!**/test/**",
    "!**/**/*.d.ts",
  ],
  coverageReporters: ["text", "json", "html","lcov", "json-summary",],
};
