module.exports = {
  testEnvironment: "node",
  roots: [
    "<rootDir>/test",
    "<rootDir>/lambda",
    "<rootDir>/lib",
    "<rootDir>/bin",
  ],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: [
    // "<rootDir>/lambda/api/*.ts",
    "**.{ts,tsx}",
    "*.{ts,tsx}",
    "**/*.{ts,tsx}",
    "**/**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/my_node_modules/**",
    "!**/test/**",
    "!**/**/*.d.ts",
  ],
  // coverageReporters: ["text"],
  coverageReporters: ["text", "json", "html","lcov"],
};
