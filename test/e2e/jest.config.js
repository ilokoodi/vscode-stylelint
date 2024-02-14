'use strict';

/** @type {import('jest').Config} */
const config = {
	testMatch: ['<rootDir>/__tests__/**/lint.[jt]s?(x)'],
	preset: 'ts-jest',
	transform: {
		'^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/../../tsconfig.test.json' }],
	},
	testPathIgnorePatterns: ['.*jest-runner-vscode.config.js'],
	verbose: true,
	modulePathIgnorePatterns: [
		'<rootDir>/../../.vscode-test',
		'<rootDir>/workspace/defaults/yarn-[^/]+/stylelint',
		'<rootDir>/workspace/defaults/local-stylelint/node_modules',
	],
	setupFilesAfterEnv: ['<rootDir>/setup.ts'],
	runner: 'vscode',
};

module.exports = config;
