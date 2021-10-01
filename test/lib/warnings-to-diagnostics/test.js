'use strict';

// eslint-disable-next-line node/no-unpublished-require
const { lint } = require('stylelint');

const fn = require('../../../lib/stylelint-warning-to-vscode-diagnostic');

describe('stylelintWarningToVscodeDiagnostic()', () => {
	test('should convert a stylelint warning into a VS Code diagnostic and consider severity level', async () => {
		expect.assertions(2);
		const {
			results: [{ warnings }],
		} = await lint({
			code: `a {
				color: #AAA;
				border-color: #bbbbbb;
			}`,
			config: {
				rules: {
					'color-hex-case': ['lower'],
					'color-hex-length': ['short', { severity: 'warning' }],
				},
			},
		});

		expect(fn(warnings[0])).toMatchSnapshot();
		expect(fn(warnings[1])).toMatchSnapshot();
	});
});
