module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/server'],
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/server/tsconfig.json'
        }
    }
};
