/**
 * @class
 * @module
 */
const LapizError = class
{
	/**
	 * @param {string} description
	 */
	constructor(description)
	{
		/**@constant @readonly*/
		this.description = description;
	}
}

module.exports = LapizError;
