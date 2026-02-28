/**
 * @file
 * @source ./lib/lapiz-backend
 * @module lapiz/backend
 * @description The module to convert the Lapiz declarations in a express Router
 * @requires module:lib/lapiz
 */

const Lapiz = require("#lib/lapiz");
const express = require("express");
const { toSafe } = require("#lib/tools");
const { Readable } = require("node:stream");
const ExpressHandler = require("#lib/express-handler");
const LapizConstants = require("#lib/constants");
/**
 * @import { ContentType, ReqOf, ResOf } from "#lib/lapiz"
 * @import Endpoint from "#lib/endpoint"
 * @import {Declaration} from "#lib/declaration"
 * @import {z} from "zod"
 */
/**
 * @typedef {(req: express.Request, res: express.Response, next?: express.NextFunction) => Promise<any>} Middelware
 */

/**
 * @template {Endpoint<string, string, Declaration<string>>}E
 * @typedef {{
 * 	contentType: ReqOf<E>["contentType"];
 *	urlParams: ReqOf<E>["urlParams"];
 *	headersParams: ReqOf<E>["headersParams"];
 *	body: (
 *		ReqOf<E>["contentType"] extends "image/jpeg" ? Readable :
 *		ReqOf<E>["body"]
 *	);
 * }} LapizBackendReq
 */

/**
 * @template {Endpoint<string, string, Declaration<string>>}E
 * @typedef {(
 * 	ResOf<E>["contentType"] extends "image/jpeg" ? ResOf<E> & { body: Readable } :
 * 	ResOf<E>
 * )} LapizBackendRes
 */

/**
 * IMPLEMENTATIONS
 * @template {Endpoint<string, string, Declaration<string>>}E
 * @typedef {{
 * 	endpoint: E;
 * 	use(
 * 		request: LapizBackendReq<E>,
 * 		extra: { expresReq: express.Request; expressRes: express.Response }
 * 	): Promise<LapizBackendRes<E>>|LapizBackendRes<E>
 * }} EndpointImplementation
 */

/**
 * METHODS MAPPER
 * @type{Record<"GET"|"POST"|"PUT"|"DELETE", "get"|"post"|"put"|"delete">}
 */
const methodsMapper = { GET: "get", POST: "post", DELETE: "delete", PUT: "put" };

/**
 * @template {Endpoint<string, string, Declaration<string>>}E
 * @param {EndpointImplementation<E>} implementation
 * @returns {Middelware}
 */
const createMiddelware = implementation => async(req, res, next) =>
{
	const reqType = Lapiz.isLapizContentType(req.headers["content-type"] || "application/void");
	if(!reqType)
	{
		//Enviar error
		const err = new Lapiz.Error.InvalidRequest(`Endpoint with name "${implementation.endpoint.name}" recibed a Lapiz invalid content-type (${req.headers["content-type"]}) in server side`);
		
		res.setHeader("Content-Type", "application/json");
		res.status(LapizBackend.resStatus._400_bad_request);
		res.send(Lapiz.Error.errorToJson(err));
		return void 0;
	}

	const lapizBackendReq = await ExpressHandler.instance.parseReq(
		reqType,
		/**@type {any}*/(implementation.endpoint),
		req
	);
	if(lapizBackendReq instanceof Lapiz.Error)
	{
		ExpressHandler.sendErrorResponse(res, lapizBackendReq);
		return void 0;
	}

	const implementationAsync = async() => await implementation.use(
		lapizBackendReq,
		{ expresReq: req, expressRes: res }
	);

	const result = await toSafe(implementationAsync());
	
	if(result.error)
	{
		//La idea es que el usuario maneje todos los errores de forma predecible sin lanzar exepciones.
		throw new Error("[LAPIZ ERROR]: The implementation must return responses, not reject errors. Please manage the implementation errors: " + result.error.message);
	}

	const errOrVoid = await ExpressHandler.instance.resSendBody(result.result.contentType, implementation.endpoint, res, result.result);
	if(errOrVoid instanceof Error) throw errOrVoid;
	return void 0;
}

/**
 * @class
 * @classdesc Is a class to implements backend modules from Lapiz Endpoints
 * @extends {LapizConstants}
 */
const LapizBackend = class extends LapizConstants
{
	/**
	 * @template {Endpoint<string, string, Declaration<string>>}E
	 * @param {E} endpoint
	 * @param {EndpointImplementation<E>["use"]} implementationFn
	 * @return {EndpointImplementation<E>}
	 */
	static implements(endpoint, implementationFn)
	{
		return { endpoint, use: implementationFn }
	}
	/**
	 * @param {EndpointImplementation<Endpoint<string, string, Declaration<string>>>[]}implementations
	 */
	constructor(...implementations)
	{
		super();

		this.router = express.Router();

		//Basic body parsers
		this.router.use(express.json());
		this.router.use(express.text());

		implementations.forEach((implementation) =>
		{
			const midd = createMiddelware(implementation);
			
			const method = methodsMapper[implementation.endpoint.method];
			this.router[method](implementation.endpoint.url, midd);
		});
	}
}

module.exports = LapizBackend;
