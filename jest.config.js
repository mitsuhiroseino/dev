/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-babel-esm',
  roots: ['<rootDir>/src/__test__'],
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'cjs', 'mjs'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    // 当プロジェクトのtsをjsに変換するために追加
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/src/__test__/tsconfig.json',
        useESM: true,
      },
    ],
  },
};
