/**
 * @file
 * @source lib/endpoint/index.js
 * @description Is a module with de Endpoint class and Types. This is a principal type of library
 */
/**
 * @import {Declaration} from "#lib/declaration"
 * @import {ContentType} from "#lib/lapiz"
 */
/**
 * @typedef {"GET"|"PUT"|"POST"|"DELETE"} Method
 */
/**
 * @template {string}Name
 * @template {string}Url
 * @template {Declaration<Url>}D
 * @typedef {{
 *	name: Name;
 *	url: Url;
 *	method: Method;
 *	declaration: D;
 * }} IEndpoint
 */

/**
 * @template {string}Name
 * @template {string}Url
 * @template {Declaration<Url>}D
 * @class
 * @classdesc Represents a endpoint struct
 * @implements {IEndpoint<Name, Url, D>}
 */
const Endpoint = class
{
	/**
	 * @param {Name} name
	 * @param {Method} method
	 * @param {Url} url
	 * @param {D} declaration
	 */
	constructor(name, method, url, declaration)
	{
		/**@type {Name} @constant @readonly*/
		this.name = name;
		/**@type {Method} @constant @readonly*/
		this.method = method;
		/**@type {Url} @constant @readonly*/
		this.url = url;
		/**@type {D} @constant @readonly*/
		this.declaration = declaration;
	}
}
module.exports = Endpoint;
