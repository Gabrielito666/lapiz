/**
 * @file
 * @source lib/lapiz/index.js
 * @module lapiz
 * @description This module is principal Lapiz module and  use to declare Endpoints
 */

const LapizError = require("#lib/lapiz-error");
const {z} = require("zod");
const Endpoint = require("#lib/endpoint");

/**
 * @import {Declaration, VoidReqDeclaration} from "#lib/declaration"
 */

/**
 * CONTENT TYPE
 * @typedef {"application/void"|"text/plain"|"application/json"|"jpeg/image"} ContentType
 */

const Lapiz = class
{
	static declareEndpoint = {
		/**
		 * @template {string} Name
		 * @template {string} Url
		 * @template {VoidReqDeclaration<Url>} D
		 * @param {Name} name
		 * @param {Url} url
		 * @param {D} declaration
		 * @returns {Endpoint<Name, Url, D>}
		 */
		get(name, url, declaration)
		{
			return  new Endpoint(name, "GET", url, declaration);
		},
		/**
		 * @template {string} Name
		 * @template {string} Url
		 * @template {Declaration<Url>} D
		 * @param {Name} name
		 * @param {Url} url
		 * @param {D} declaration
		 * @returns {Endpoint<Name, Url, D>}
		 */
		put(name, url, declaration)
		{
			return  new Endpoint(name, "PUT", url, declaration);
		},
		/**
		 * @template {string} Name
		 * @template {string} Url
		 * @template {Declaration<Url>} D
		 * @param {Name} name
		 * @param {Url} url
		 * @param {D} declaration
		 * @returns {Endpoint<Name, Url, D>}
		 */
		post(name, url, declaration)
		{
			return  new Endpoint(name, "POST", url, declaration);
		},
		/**
		 * @template {string} Name
		 * @template {string} Url
		 * @template {VoidReqDeclaration<Url>} D
		 * @param {Name} name
		 * @param {Url} url
		 * @param {D} declaration
		 * @returns {Endpoint<Name, Url, D>}
		 */
		delete(name, url, declaration)
		{
			return  new Endpoint(name, "DELETE", url, declaration);
		}
	}

	/**@type {ContentType[]}*/
	static contentTypes = ["application/void", "text/plain", "application/json", "jpeg/image"];
	static contentTypeSchemas = {
		void: z.literal("application/void"),
		textPlain: z.literal("text/plain"),
		applicationJson: z.literal("application/json"),
		jpegImage: z.literal("jpeg/image")
	}
	static statusList = {
		notFound_404: z.literal(404)
		//etc
	}

	static Error = LapizError;

	/**
	 * @param {any} contentType
	 * @return {ContentType|false}
	 */
	static isLapizContentType(contentType)
	{
		if(Lapiz.contentTypes.includes(contentType))
		{
			return /**@type {ContentType}*/(contentType);
		}
		return false;
	}

	constructor()
	{

	}
};

const ep = Lapiz.declareEndpoint.post("endpoint-1", "/my/url/:param", {
	request: z.object({
		contentType: Lapiz.contentTypeSchemas.textPlain,
		urlParams: z.object({	
			param: z.union([z.literal("op1"), z.literal("op2")])
		}),
		headersParams: z.object({
		
		}),
		body: z.union([z.literal("hola"), z.literal("mundo")])
	}),
	response: z.object({
		status: z.literal(404),
		contentType: Lapiz.contentTypeSchemas.applicationJson,
		headersParams: z.object({
		
		}),
		body: z.object({
			a: z.string()
		})
	})
});

//UTILITYS
/**
 * @template {{ declaration: { request: z.ZodTypeAny; }}}E
 * @typedef {z.infer<E["declaration"]["request"]>} ReqOf
 */

/**
 * @template {{declaration: {response: z.ZodTypeAny; }}}E
 * @typedef {z.infer<E["declaration"]["response"]>} ResOf
 */

module.exports = Lapiz;
