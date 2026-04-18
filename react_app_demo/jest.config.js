/** @type {import('jest').Config} */
const path = require('path');

module.exports = {
    rootDir: path.resolve(__dirname),
    roots: [path.resolve(__dirname, 'src')],
    // Use testRegex instead of testMatch to avoid micromatch skipping .gemini directory
    testRegex: 'src(/(__tests__)/|/).+\\.test\\.(js|jsx)$',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': ['babel-jest', {
            presets: [
                ['@babel/preset-env', { targets: { node: 'current' } }],
                ['@babel/preset-react', { runtime: 'automatic' }],
            ],
        }],
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(react-router|react-router-dom|@remix-run)/)',
    ],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/fileMock.js',
        '\\.(gif|ttf|eot|svg|png|jpg|jpeg|woff|woff2)$': '<rootDir>/src/__mocks__/fileMock.js',
    },
    setupFilesAfterFramework: [],
    setupFilesAfterFramework: ['<rootDir>/src/setupTests.js'],
    testPathIgnorePatterns: ['/node_modules/'],
};
