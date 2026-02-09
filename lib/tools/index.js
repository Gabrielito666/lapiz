/**
 * @file
 * @source lib/tools/index.js
 * @description A module with utilitys for develop of this library
 */

/**
 * @template {Promise<any>}P
 * @param {P} p
 * @returns {Promise<{error: null; result: Awaited<P>;}|{error: Error; result: null; }>}
 */
const toSafe = (p) => p
	.then(value => ({
		error: null,
		result: value
	}))
	.catch(err => ({
		error: err instanceof Error ? err : new Error(String(err)),
		result: null
	}));

module.exports = { toSafe };
