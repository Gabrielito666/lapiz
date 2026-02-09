/**
 * @file
 * @source ./lib/lapiz-backend
 * @module lapiz/backend
 * @description The module to convert the Lapiz declarations in a express Router
 * @requires module:lib/lapiz
 */

const Lapiz = require("#lib/lapiz");
const express = require("express");
const { z } = require("zod");
const { toSafe } = require("#lib/tools");
const { fileTypeStream } = require("file-type");
const { Readable } = require("node:stream");

/**
 * @import { ContentType, ReqOf, ResOf } from "#lib/lapiz"
 * @import Endpoint from "#lib/endpoint"
 * @import {Declaration} from "#lib/declaration"
 * @import { TLapizError as LapizError } from "#lib/lapiz-error"
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
 *	body: 	ReqOf<E>["contentType"] extends "application/void" ? undefined :
*		ReqOf<E>["contentType"] extends "jpeg/image" ? Readable :
 *		ReqOf<E>["body"];
 * }} LapizBackendReq
 */

/**
 * @template {Endpoint<string, string, Declaration<string>>}E
 * @typedef {{
 * 	contentType: ResOf<E>["contentType"];
 *	status: ResOf<E>["status"];
 *	headersParams: ResOf<E>["headersParams"];
 *	body: ResOf<E>["contentType"] extends "application/void" ? undefined :
 *		ResOf<E>["contentType"] extends "jpeg/image" ? Readable :
 *		ResOf<E>["body"];
 * }} LapizBackendRes
 */

/**
 * IMPLEMENTATIONS
 * @template {Endpoint<string, string, Declaration<string>>}E
 * @typedef {{
 * 	endpoint: E;
 * 	use(
 * 		request: LapizBackendReq<E>,
 * 		extra: { expresReq: express.Request; expressRes: express.Response }
 * 	): Promise<LapizBackendRes<E>|LapizError>|LapizBackendRes<E>|LapizError
 * }} EndpointImplementation
 */

/**
 * @template {ContentType}T
 * @typedef {{
 *	contentType: ContentType;
 *	parseReq<E extends Endpoint<string, string, Declaration<string>>>(
 *		endpoint: E,
 *		expressReq: express.Request
 *	):LapizBackendReq<E>|LapizError
 * }} IExpressParser
 */

/**
 * @class
 * @abstract
 * @classdesc This class is for parse a express request to a implementation request
 * @template {ContentType}T
 * @implements {IExpressParser<T>}
 */
const ExpressParser = class
{
	/**
	 * @param {T} contentType
	 */
	constructor(contentType)
	{
		/**@constant @readonly @type {ContentType}*/
		this.contentType = contentType;
	}
	/**@type {IExpressParser<T>["parseReq"]}*/
	parseReq(endpoint, expressReq)
	{
		throw new Error("Lapiz internal: the method run must be implementated");
	}
}
/**
 * @class
 * @classdesc Class for parse a express req or res when its type are application/void
 * @implements {IExpressParser<"application/void">}
 * @extends {ExpressParser<"application/void">}
 */
const ExpressParserVOID = class extends ExpressParser
{
	constructor()
	{
		super("application/void");
	}
	/**@type {IExpressParser<"application/void">["parseReq"]}*/
	parseReq(endpoint, req)
	{
		const urlParams = req.params;
		const headersParams = req.headers;

		if(req.headers["content-type"] !== undefined) return new Lapiz.Error.InvalidRequest(); //TODO hay que hacerlo más espesífico
		
		const reqConfirmation = endpoint.declaration.request.safeParse({
			contentType: "application/void",
			urlParams,
			headersParams,
			body: undefined
		});

		if(reqConfirmation.error) return new Lapiz.Error.InvalidRequest();

		return {
			contentType: reqConfirmation.data.contentType,
			urlParams: reqConfirmation.data.urlParams,
			headersParams: reqConfirmation.data.headersParams,
			body: /**@type {LapizBackendReq<typeof endpoint>["body"]}*/(undefined)
		}
	}
}
/**
 * @class
 * @classdesc Class for parse a express req or res when its type are text/plain
 * @implements {IExpressParser<"text/plain">}
 * @extends {ExpressParser<"text/plain">}
 */
const ExpressParserTEXT = class extends ExpressParser
{
	constructor()
	{
		super("text/plain");
	}
	/**@type {IExpressParser<"text/plain">["parseReq"]}*/
	parseReq(endpoint, req)
	{
		if(req.headers["content-type"] !== "text/plain") return new Lapiz.Error.InvalidRequest(); //TODO hay que hacerlo más espesífico
			
		const urlParams = req.params;
		const headersParams = req.headers;
		const body = req.body;

		const reqConfirmation = endpoint.declaration.request.safeParse({
			contentType: req.headers["content-type"],
			urlParams,
			headersParams,
			body	//supuestamente pre parseado con un bodyParser
		});

		if(reqConfirmation.error) return new Lapiz.Error.InvalidRequest();

		return /**@type {LapizBackendReq<typeof endpoint>}*/(reqConfirmation.data);
	}
}
/**
 * @class
 * @classdesc Class for parse a express req or res when its type are application/json
 * @implements {IExpressParser<"application/json">}
 * @extends {ExpressParser<"application/json">}
 */
const ExpressParserJSON = class extends ExpressParser
{
	constructor()
	{
		super("application/json");
	}
	/**@type {IExpressParser<"application/json">["parseReq"]}*/
	parseReq(endpoint, req)
	{
		const urlParams = req.params;
		const headersParams = req.headers;
		const body = req.body;

		const reqConfirmation = endpoint.declaration.request.safeParse({
			contentType: req.headers["content-type"],
			urlParams,
			headersParams,
			body	//supuestamente pre parseado con un body parser
		});
		if(reqConfirmation.error) return new Lapiz.Error.InvalidRequest();

		return /**@type {LapizBackendReq<typeof endpoint>}*/(reqConfirmation.data);
	}
}
/**
 * @class
 * @classdesc Class for parse a express req or res when its type are jpeg/image
 * @implements {IExpressParser<"jpeg/image">}
 * @extends {ExpressParser<"jpeg/image">}
 */
const ExpressParserJPEG = class extends ExpressParser
{
	constructor()
	{
		super("jpeg/image");
	}
	/**@type {IExpressParser<"jpeg/image">["parseReq"]}*/
	async parseReq(endpoint, req)
	{
		if(req.headers["content-type"] !== "jpeg/image")
		{
			return new Lapiz.Error.InvalidRequest(); //TODO hacerlo más espesífico
		}
		const urlParams = req.params;
		const headers = req.headers;
		const body = "__JPEG_IMAGE_SYMBOL__";

		const reqConfirmation = endpoint.declaration.request.safeParse({
			contentType: req.headers["content-type"],
			urlParams,
			headers,
			body
		});
		if(reqConfirmation.error) return new Lapiz.Error.InvalidRequest();
		
		const bodyValidation = await fileTypeStream(req);

		if(bodyValidation.fileType?.mime !== this.contentType)
		{
			return new Lapiz.Error.InvalidRequest();
		}

		return {
			contentType: reqConfirmation.data.contentType,
			urlParams: reqConfirmation.data.urlParams,
			headersParams: reqConfirmation.data.headersParams,
			body: /**@type {LapizBackendReq<typeof endpoint>["body"]}*/(
				/**@type {unknown}*/(bodyValidation) //TODO No se porque no me deja sin esto
			)
		};
	}
}
/**
 * @class
 * @classdesc In this class compose the parsers
 * @template {ExpressParser<any>[]}P
 */
const ExpressParserByContentType = class
{
	/**
	 * @param {P} parsers
	 */
	constructor(...parsers)
	{
		/**@type {Map<ContentType, P[number]>}*/
		this.parsersMap = new Map();

		parsers.forEach(p =>
		{
			this.parsersMap.set(p.contentType, p);
		});
	}
	/**
	 * @template {ContentType}T
	 * @param {T} contentType
	 * @returns {ExpressParser<T>}
	 */
	getParser(contentType)
	{
		const parser = this.parsersMap.get(contentType);
		if(!parser) throw new Error("Lapiz internal: not implments yet this content-type");
		return parser;
	}
	/**
	 * @template {ContentType}T
	 * @template {Endpoint<string, string, Declaration<string>>}E
	 * @param {T} contentType
	 * @param {E} endpoint
	 * @param {express.Request} req
	 */
	parseReq(contentType, endpoint, req)
	{
		return this.getParser(contentType).parseReq(/**@type {any}*/(endpoint), req);
	}
}
ExpressParserByContentType.instance = new ExpressParserByContentType(
	new ExpressParserVOID(),
	new ExpressParserTEXT(),
	new ExpressParserJSON(),
	new ExpressParserJPEG()
);
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
	const reqType = Lapiz.isLapizContentType(req.headers["content-type"]);
	if(!reqType)
	{
		//Enviar error
		const err = new Lapiz.Error.InvalidRequest();
		
		res.setHeader("Content-Type", "application/json");
		res.status(LapizBackend.resStatus._400_bad_request);
		res.send(Lapiz.Error.errorToJson(err));
		return void 0;
	}

	const lapizBackendReq = ExpressParserByContentType.instance.parseReq(
		reqType,
		/**@type {any}*/(implementation.endpoint),
		req
	);
	if(lapizBackendReq instanceof Lapiz.Error)
	{
		if(lapizBackendReq instanceof Lapiz.Error.InvalidRequest)
		{
			res.status(LapizBackend.resStatus._400_bad_request);
		}
		else
		{
			res.status(LapizBackend.resStatus._500_internal_server_error);
		}
		res.setHeader("Content-Type", "application/json");
		res.send(Lapiz.Error.errorToJson(lapizBackendReq));
		return void 0;
	}

	const implementationAsync = async() => await implementation.use(
		lapizBackendReq,
		{ expresReq: req, expressRes: res }
	);

	const result = await toSafe(implementationAsync());

	if(result.error)
	{
		throw new Error("[LAPIZ ERROR]: The implementation must return responses, not reject errors. Please manage the implementation errors: " + result.error.message);
	}

	if(result.result instanceof Lapiz.Error)
	{
		if(lapizBackendReq instanceof Lapiz.Error.InvalidRequest)
		{
			res.status(LapizBackend.resStatus._400_bad_request);
		}
		else
		{
			res.status(LapizBackend.resStatus._500_internal_server_error);
		}
		res.setHeader("Content-Type", "application/json");
		res.send(Lapiz.Error.errorToJson(result.result));

		return void 0;
	}
	
	res.status(result.result.status);
	Object.entries(result.result.headersParams)
		.forEach(([key, value]) => { res.setHeader(key, value) });

	if(result.result.body instanceof Readable)
	{
		result.result.body.pipe(res);
		return void 0;
	}
	if(typeof result.result.body === "string")	
	{
		res.send(result.result.body);
		return void 0;
	}
	if(typeof result.result.body === "undefined")
	{
		res.send();
		return void 0;
	}
	res.json(result.result.body);
	return void 0;
}

const LapizBackend = class
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
	static resStatus = {
		/** @type {100} */ _100_continue: 100,
		/** @type {101} */ _101_switching_protocols: 101,
		/** @type {102} */ _102_processing: 102,

		/** @type {200} */ _200_ok: 200,
		/** @type {201} */ _201_created: 201,
		/** @type {202} */ _202_accepted: 202,
		/** @type {203} */ _203_non_authoritative_information: 203,
		/** @type {204} */ _204_no_content: 204,
		/** @type {205} */ _205_reset_content: 205,
		/** @type {206} */ _206_partial_content: 206,
		/** @type {207} */ _207_multi_status: 207,
		/** @type {208} */ _208_already_reported: 208,
		/** @type {226} */ _226_im_used: 226,

		/** @type {300} */ _300_multiple_choices: 300,
		/** @type {301} */ _301_moved_permanently: 301,
		/** @type {302} */ _302_found: 302,
		/** @type {303} */ _303_see_other: 303,
		/** @type {304} */ _304_not_modified: 304,
		/** @type {305} */ _305_use_proxy: 305,
		/** @type {307} */ _307_temporary_redirect: 307,
		/** @type {308} */ _308_permanent_redirect: 308,

		/** @type {400} */ _400_bad_request: 400,
		/** @type {401} */ _401_unauthorized: 401,
		/** @type {402} */ _402_payment_required: 402,
		/** @type {403} */ _403_forbidden: 403,
		/** @type {404} */ _404_not_found: 404,
		/** @type {405} */ _405_method_not_allowed: 405,
		/** @type {406} */ _406_not_acceptable: 406,
		/** @type {407} */ _407_proxy_authentication_required: 407,
		/** @type {408} */ _408_request_timeout: 408,
		/** @type {409} */ _409_conflict: 409,
		/** @type {410} */ _410_gone: 410,
		/** @type {411} */ _411_length_required: 411,
		/** @type {412} */ _412_precondition_failed: 412,
		/** @type {413} */ _413_payload_too_large: 413,
		/** @type {414} */ _414_uri_too_long: 414,
		/** @type {415} */ _415_unsupported_media_type: 415,
		/** @type {416} */ _416_range_not_satisfiable: 416,
		/** @type {417} */ _417_expectation_failed: 417,
		/** @type {418} */ _418_im_a_teapot: 418,
		/** @type {421} */ _421_misdirected_request: 421,
		/** @type {422} */ _422_unprocessable_entity: 422,
		/** @type {423} */ _423_locked: 423,
		/** @type {424} */ _424_failed_dependency: 424,
		/** @type {425} */ _425_too_early: 425,
		/** @type {426} */ _426_upgrade_required: 426,
		/** @type {428} */ _428_precondition_required: 428,
		/** @type {429} */ _429_too_many_requests: 429,
		/** @type {431} */ _431_request_header_fields_too_large: 431,
		/** @type {451} */ _451_unavailable_for_legal_reasons: 451,

		/** @type {500} */ _500_internal_server_error: 500,
		/** @type {501} */ _501_not_implemented: 501,
		/** @type {502} */ _502_bad_gateway: 502,
		/** @type {503} */ _503_service_unavailable: 503,
		/** @type {504} */ _504_gateway_timeout: 504,
		/** @type {505} */ _505_http_version_not_supported: 505,
		/** @type {506} */ _506_variant_also_negotiates: 506,
		/** @type {507} */ _507_insufficient_storage: 507,
		/** @type {508} */ _508_loop_detected: 508,
		/** @type {510} */ _510_not_extended: 510,
		/** @type {511} */ _511_network_authentication_required: 511
	};
	static resContentType = {
		/**@type {"application/void"}*/	void: "application/void",
		/**@type {"text/plain"}*/	textPlain: "text/plain",
		/**@type {"application/json"}*/	applicationJson: "application/json",
		/**@type {"jpeg/image"}*/	jpegImage: "jpeg/image"
	}
	/**
	 * @param {EndpointImplementation<Endpoint<string, string, Declaration<string>>>[]}implementations
	 */
	constructor(...implementations)
	{
		this.router = express.Router();
		implementations.forEach((implementation) =>
		{
			const midd = createMiddelware(implementation);
			
			const method = methodsMapper[implementation.endpoint.method];
			this.router[method](implementation.endpoint.url, midd);
		});
	}
}

const ep = Lapiz.declareEndpoint.put("mi-endpoint", "/my/url/:param1", {
	request: z.object({
		urlParams: z.object({
			param1: z.string()
		}),
		contentType: Lapiz.contentTypeSchemas.jpegImage,
		headersParams: z.object({
			extraParam: z.string()
		}),
		body: z.literal("__JPEG_IMAGE_SYMBOL__") //TODO
	}),
	response: z.object({
		contentType: Lapiz.contentTypeSchemas.void,
		status: z.union([z.literal(200), z.literal(404)]),
		headersParams: z.object({}),
		body: z.undefined()
	})
});

const implementation = LapizBackend.implements(ep, ({ headersParams, urlParams, body }, {expresReq, expressRes}) =>
{
	expressRes.cookie("my-cookie", "my value");
	if(urlParams.param1 === "holi-bro")
	{
		return {
			contentType: LapizBackend.resContentType.void,
			status: LapizBackend.resStatus._200_ok,
			headersParams: {},
			body: undefined
		}
	}
	return {
		contentType: LapizBackend.resContentType.void,
		status: LapizBackend.resStatus._404_not_found,
		headersParams: {},
		body: undefined
	}
});

module.exports = LapizBackend;
