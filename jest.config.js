export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'json', 'node'],
  testPathIgnorePatterns: ['/__tests__/streamingServer.test.js'],
  projects: [
    {
      displayName: 'default',
      testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
      testPathIgnorePatterns: ['/__tests__/streamingServer.test.js'],
    },
    {
      displayName: 'esm',
      testMatch: ['**/__tests__/streamingServer.test.js'],
      runner: 'jest-runner',
      testEnvironment: 'node',
    },
  ],
};