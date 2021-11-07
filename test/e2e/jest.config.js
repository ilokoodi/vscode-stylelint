'use strict';

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
	testMatch: [
		'<rootDir>/*/index.[jt]s?(x)',
		'<rootDir>/defaults/*.[jt]s?(x)',
		'<rootDir>/config/*.[jt]s?(x)',
		'<rootDir>/report-disables/*.[jt]s?(x)',
	],
	preset: 'ts-jest',
	globals: { 'ts-jest': { tsconfig: '<rootDir>/../../tsconfig.test.json' } },
	testPathIgnorePatterns: ['.*jest-runner-vscode.config.js'],
	verbose: true,
	modulePathIgnorePatterns: [
		'<rootDir>/../../.vscode-test',
		'<rootDir>/defaults/workspace/yarn-[^/]+/stylelint',
		'<rootDir>/defaults/workspace/local-stylelint/node_modules',
	],
	setupFilesAfterEnv: ['<rootDir>/setup.ts'],
	runner: 'vscode',
};

module.exports = config;
