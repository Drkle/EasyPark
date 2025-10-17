// backend/jest.config.js
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.js', '**/*.spec.js'],   // <- también .spec.js

  testTimeout: 60000,

  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/config.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],

  // estos thresholds NO afectan Sonar, solo Jest (puedes dejarlos igual o quitarlos)
  coverageThreshold: {
    global: { lines: 0.6, functions: 0.6, branches: 0.6, statements: 0.6 }
  },

  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTestEnv.js']
};
