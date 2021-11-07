'use strict';

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
	testMatch: ['<rootDir>/*/test.[jt]s?(x)'],
	preset: 'ts-jest',
	globals: { 'ts-jest': { tsconfig: '<rootDir>/../../tsconfig.test.json' } },
	verbose: true,
	modulePathIgnorePatterns: [
		'<rootDir>/../../.vscode-test',
		'<rootDir>/../e2e/workspace/defaults/yarn-[^/]+/stylelint',
		'<rootDir>/../e2e/workspace/defaults/local-stylelint/node_modules',
	],
};

module.exports = config;
