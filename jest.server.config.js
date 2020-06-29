module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/server'],
    globals: {
        'ts-jest': {
            tsConfig: '<rootDir>/server/tsconfig.json'
        }
    }
};
