// backend/jest.config.js
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],

  // ⏱️ Subimos timeout por descargas/arranque de Mongo en memoria
  testTimeout: 60000,

  // Cobertura (excluimos server.js y config.js)
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/config.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: { lines: 0.6, functions: 0.6, branches: 0.6, statements: 0.6 }
  },

  // Setup (Mongo en memoria)
  setupFilesAfterEnv: ['<rootDir>/tests/setupTestEnv.js']
};
