module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.js'],
  
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native)/)'
  ],
  
  testMatch: ['**/__tests__/**/*.test.js'],
};
