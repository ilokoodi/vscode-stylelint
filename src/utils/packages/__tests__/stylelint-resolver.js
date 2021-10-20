'use strict';

jest.mock('vscode-languageserver/node');
jest.mock('../global-path-resolver');

const path = require('path');

const mockCWD = path.join('/fake', 'cwd');

jest.mock('../../documents', () => ({
	getWorkspaceFolder: jest.fn(async () => mockCWD),
}));

const { StylelintResolver } = require('../stylelint-resolver');

/** @returns {lsp.Connection} */
const createMockConnection = () =>
	/** @type {any} */ ({
		console: { error: jest.fn() },
		window: { showErrorMessage: jest.fn() },
		tracer: { log: jest.fn() },
	});

/** @returns {winston.Logger} */
const createMockLogger = () =>
	/** @type {any} */ ({
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	});

/** @returns {lsp.TextDocument} */
const createMockTextDocument = (nonFileURI = false) =>
	/** @type {any} */ ({
		uri: nonFileURI ? 'scheme:///fake/cwd/document.css' : 'file:///fake/cwd/document.css',
	});

const goodStylelintPath = path.join(__dirname, 'stylelint.js');
const badStylelintPath = path.join(__dirname, 'bad-stylelint.js');

/** @type {{[packageManager in PackageManager]: string}} */
const mockGlobalPaths = {
	yarn: path.join('/fake', 'yarn'),
	npm: path.join('/fake', 'npm'),
	pnpm: path.join('/fake', 'pnpm'),
};

jest.mock(
	require('path').join(__dirname, 'stylelint.js'),
	() => ({ lint: jest.fn(() => 'good') }),
	{ virtual: true },
);
jest.mock(require('path').join(__dirname, 'bad-stylelint.js'), () => ({}), { virtual: true });

const { Files: mockedFiles } = /** @type {tests.mocks.VSCodeLanguageServerModule.Node} */ (
	require('vscode-languageserver/node')
);

/**
 * @param {PackageManager} packageManager
 * @param {string} stylelintPath
 */
const mockGlobalFileResolution = (packageManager, stylelintPath) => {
	mockedFiles.__mockResolution('stylelint', (globalPath, cwd, trace) => {
		trace && trace('Resolving globally');

		return cwd === mockCWD && globalPath === mockGlobalPaths[packageManager]
			? stylelintPath
			: undefined;
	});
};

/**
 * @param {string} stylelintPath
 */
const mockLocalFileResolution = (stylelintPath) => {
	mockedFiles.__mockResolution('stylelint', (_, cwd, trace) => {
		trace && trace('Resolving locally');

		return cwd === mockCWD ? stylelintPath : undefined;
	});
};

const mockedGlobalPathResolver = /** @type {tests.mocks.GlobalPathResolver} */ (
	require('../global-path-resolver')
);

mockedGlobalPathResolver.__mockPath('yarn', mockGlobalPaths.yarn);
mockedGlobalPathResolver.__mockPath('npm', mockGlobalPaths.npm);
mockedGlobalPathResolver.__mockPath('pnpm', mockGlobalPaths.pnpm);

describe('StylelintResolver', () => {
	test('should resolve valid custom Stylelint paths', async () => {
		const connection = createMockConnection();
		const stylelintResolver = new StylelintResolver(connection);
		const stylelint = await stylelintResolver.resolve(
			{ stylelintPath: goodStylelintPath },
			createMockTextDocument(),
		);

		expect(stylelint?.lint({})).toBe('good');
		expect(connection.console.error).not.toHaveBeenCalled();
		expect(connection.window.showErrorMessage).not.toHaveBeenCalled();
		expect(connection.tracer.log).not.toHaveBeenCalled();
	});

	test('should resolve to undefined for custom Stylelint paths pointing to modules without a lint function', async () => {
		const connection = createMockConnection();
		const logger = createMockLogger();
		const stylelintResolver = new StylelintResolver(connection, logger);
		const stylelint = await stylelintResolver.resolve(
			{ stylelintPath: badStylelintPath },
			createMockTextDocument(),
		);

		expect(stylelint).toBeUndefined();
		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.error).toHaveBeenCalledTimes(1);
		expect(connection.window.showErrorMessage).toHaveBeenCalledTimes(1);
		expect(connection.tracer.log).not.toHaveBeenCalled();
	});

	test('should throw on invalid custom Stylelint paths', async () => {
		const connection = createMockConnection();
		const logger = createMockLogger();
		const stylelintResolver = new StylelintResolver(connection, logger);

		await expect(
			stylelintResolver.resolve({ stylelintPath: './does-not-exist' }, createMockTextDocument()),
		).rejects.toThrowErrorMatchingSnapshot();
		expect(logger.error).toHaveBeenCalledTimes(1);
		expect(connection.window.showErrorMessage).toHaveBeenCalledTimes(1);
		expect(connection.tracer.log).not.toHaveBeenCalled();
	});

	test('should resolve workspace Stylelint modules', async () => {
		mockLocalFileResolution(goodStylelintPath);

		const connection = createMockConnection();
		const stylelintResolver = new StylelintResolver(connection);
		const stylelint = await stylelintResolver.resolve({}, createMockTextDocument());

		expect(stylelint?.lint({})).toBe('good');
		expect(connection.console.error).not.toHaveBeenCalled();
		expect(connection.window.showErrorMessage).not.toHaveBeenCalled();
		expect(connection.tracer.log).toHaveBeenCalledTimes(1);
	});

	test('should resolve workspace Stylelint modules for documents with non-file URIs', async () => {
		mockLocalFileResolution(goodStylelintPath);

		const connection = createMockConnection();
		const stylelintResolver = new StylelintResolver(connection);
		const stylelint = await stylelintResolver.resolve({}, createMockTextDocument(true));

		expect(stylelint?.lint({})).toBe('good');
		expect(connection.console.error).not.toHaveBeenCalled();
		expect(connection.window.showErrorMessage).not.toHaveBeenCalled();
		expect(connection.tracer.log).toHaveBeenCalledTimes(1);
	});

	test('should resolve global Stylelint modules using yarn', async () => {
		mockGlobalFileResolution('yarn', goodStylelintPath);

		const connection = createMockConnection();
		const stylelintResolver = new StylelintResolver(connection);
		const stylelint = await stylelintResolver.resolve(
			{ packageManager: 'yarn' },
			createMockTextDocument(),
		);

		expect(stylelint?.lint({})).toBe('good');
		expect(connection.console.error).not.toHaveBeenCalled();
		expect(connection.window.showErrorMessage).not.toHaveBeenCalled();
		expect(connection.tracer.log).toHaveBeenCalledTimes(1);
	});

	test('should resolve global Stylelint modules using npm', async () => {
		mockGlobalFileResolution('npm', goodStylelintPath);

		const connection = createMockConnection();
		const stylelintResolver = new StylelintResolver(connection);
		const stylelint = await stylelintResolver.resolve(
			{ packageManager: 'npm' },
			createMockTextDocument(),
		);

		expect(stylelint?.lint({})).toBe('good');
		expect(connection.console.error).not.toHaveBeenCalled();
		expect(connection.window.showErrorMessage).not.toHaveBeenCalled();
		expect(connection.tracer.log).toHaveBeenCalledTimes(1);
	});

	test('should resolve global Stylelint modules using pnpm', async () => {
		mockGlobalFileResolution('pnpm', goodStylelintPath);

		const connection = createMockConnection();
		const stylelintResolver = new StylelintResolver(connection);
		const stylelint = await stylelintResolver.resolve(
			{ packageManager: 'pnpm' },
			createMockTextDocument(),
		);

		expect(stylelint?.lint({})).toBe('good');
		expect(connection.console.error).not.toHaveBeenCalled();
		expect(connection.window.showErrorMessage).not.toHaveBeenCalled();
		expect(connection.tracer.log).toHaveBeenCalledTimes(1);
	});

	test('should return undefined when no Stylelint module is found globally or in the workspace', async () => {
		mockedFiles.__resetMockedResolutions();

		const connection = createMockConnection();
		const logger = createMockLogger();
		const stylelintResolver = new StylelintResolver(connection, logger);
		const stylelint = await stylelintResolver.resolve({}, createMockTextDocument());

		expect(stylelint).toBeUndefined();
		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(connection.window.showErrorMessage).not.toHaveBeenCalled();
		expect(connection.tracer.log).not.toHaveBeenCalled();
	});

	test('should work without a connection', async () => {
		mockGlobalFileResolution('npm', goodStylelintPath);

		let stylelint = await new StylelintResolver().resolve(
			{ packageManager: 'npm' },
			createMockTextDocument(),
		);

		expect(stylelint?.lint({})).toBe('good');

		mockGlobalFileResolution('npm', badStylelintPath);

		stylelint = await new StylelintResolver().resolve(
			{ packageManager: 'npm' },
			createMockTextDocument(),
		);

		expect(stylelint).toBeUndefined();

		await expect(
			new StylelintResolver().resolve(
				{ stylelintPath: './does-not-exist' },
				createMockTextDocument(),
			),
		).rejects.toThrowErrorMatchingSnapshot();
	});
});
