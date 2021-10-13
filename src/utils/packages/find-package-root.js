'use strict';

const fs = require('fs/promises');
const path = require('path');

/**
 * Walks up the file tree from the given directory until it finds a directory
 * containing a file named `package.json`. Resolves to `undefined` if no such
 * directory is found.
 * @param {string} directory The directory to start from.
 * @returns {Promise<string | undefined>}
 */
async function findPackageRoot(directory) {
	let currentDirectory = directory;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const manifestPath = path.join(currentDirectory, 'package.json');

		try {
			const stat = await fs.stat(manifestPath);

			if (stat.isFile()) {
				return currentDirectory;
			}

			const parent = path.dirname(currentDirectory);

			if (!path.relative(parent, currentDirectory)) {
				return undefined;
			}

			currentDirectory = parent;
		} catch (error) {
			if (/** @type {{code?: string}} */ (error).code === 'ENOENT') {
				const parent = path.dirname(currentDirectory);

				if (!path.relative(parent, currentDirectory)) {
					return undefined;
				}

				currentDirectory = parent;
			} else {
				throw error;
			}
		}
	}
}

module.exports = {
	findPackageRoot,
};
