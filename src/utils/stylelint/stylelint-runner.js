'use strict';

const os = require('os');
const { URI } = require('vscode-uri');
const { StylelintResolver } = require('../packages');
const { getWorkspaceFolder } = require('../documents');
const { processLinterResult } = require('./process-linter-result');
const { buildStylelintOptions } = require('./build-stylelint-options');

/**
 * Runs Stylelint in VS Code.
 */
class StylelintRunner {
	/**
	 * The language server connection.
	 * @type {lsp.Connection | undefined}
	 */
	#connection;

	/**
	 * The logger to use, if any.
	 * @type {winston.Logger | undefined}
	 */
	#logger;

	/**
	 * The Stylelint resolver.
	 * @type {StylelintResolver}
	 */
	#stylelintResolver;

	/**
	 * @param {lsp.Connection} [connection]
	 * @param {winston.Logger} [logger]
	 * @param {StylelintResolver} [resolver]
	 */
	constructor(connection, logger, resolver) {
		this.#connection = connection;
		this.#logger = logger;
		this.#stylelintResolver = resolver ?? new StylelintResolver(connection, logger);
	}

	/**
	 * Lints the given document using Stylelint. The linting result is then
	 * converted to LSP diagnostics and returned.
	 * @param {lsp.TextDocument} document
	 * @param {stylelint.LinterOptions} [linterOptions]
	 * @param {ExtensionOptions} [extensionOptions]
	 * @returns {Promise<LintDiagnostics>}
	 */
	async lintDocument(document, linterOptions = {}, extensionOptions = {}) {
		const workspaceFolder =
			this.#connection && (await getWorkspaceFolder(this.#connection, document));

		const result = await this.#stylelintResolver.resolve(extensionOptions, document);

		if (!result) {
			this.#logger?.info('No Stylelint found with which to lint document', {
				uri: document.uri,
				options: extensionOptions,
			});

			return { diagnostics: [] };
		}

		const { stylelint } = result;

		const { fsPath } = URI.parse(document.uri);

		// Workaround for Stylelint treating paths as case-sensitive on Windows
		// If the drive letter is lowercase, we need to convert it to uppercase
		// See https://github.com/stylelint/stylelint/issues/5594
		// TODO: Remove once fixed upstream
		const codeFilename =
			os.platform() === 'win32'
				? fsPath.replace(/^[a-z]:/, (match) => match.toUpperCase())
				: fsPath;

		/** @type {stylelint.LinterOptions} */
		const options = {
			...(await buildStylelintOptions(
				document.uri,
				workspaceFolder,
				linterOptions,
				extensionOptions,
			)),
			code: document.getText(),
			formatter: () => '',
		};

		if (codeFilename) {
			options.codeFilename = codeFilename;
		} else if (!linterOptions?.config?.rules) {
			options.config = { rules: {} };
		}

		if (this.#logger?.isDebugEnabled()) {
			this.#logger?.debug('Running Stylelint', { options: { ...options, code: '...' } });
		}

		try {
			return processLinterResult(stylelint, await stylelint.lint(options));
		} catch (err) {
			if (
				err instanceof Error &&
				(err.message.startsWith('No configuration provided for') ||
					err.message.includes('No rules found within configuration'))
			) {
				// Check only CSS syntax errors without applying any Stylelint rules
				return processLinterResult(
					stylelint,
					await stylelint.lint({ ...options, config: { rules: {} } }),
				);
			}

			throw err;
		}
	}
}

module.exports = {
	StylelintRunner,
};
