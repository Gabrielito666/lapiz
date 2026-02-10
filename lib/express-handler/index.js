/**
 * @file
 * @source lib/express-handler
 * @description A file to parse express req and res by a lapiz.endpoint
 * exports a ExpressHandler class. this use with the singleton ExpressHandler.instance
 */
const Lapiz = require("#lib/lapiz");
const {fileTypeStream} = require("file-type");
/**
 * @import Endpoint from "#lib/endpoint"
 * @import {ContentType} from "#lib/lapiz"
 * @import {LapizBackendReq, LapizBackendRes} from "#lib/lapiz-backend"
 * @import {TLapizError as LapizError} from "#lib/lapiz-error"
 * @import {Declaration} from "#lib/declaration"
 * @import express from "express"
 * @import {Readable} from "node:stream"
 */
/**
 * @template {ContentType}T
 * @typedef {{
 *	contentType: ContentType;
 *	parseReq<E extends Endpoint<string, string, Declaration<string>>>(
 *		endpoint: E,
 *		expressReq: express.Request
 *	):Promise<LapizBackendReq<E>|LapizError>
 *	resSendBody(
 *		endpoint: Endpoint<string, string, Declaration<string>>,
 *		expressRes: express.Response,
 *		lapizBackendRes: LapizBackendRes<Endpoint<string, string, Declaration<string>>>,
 *	):Promise<void|Error>
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
		throw new Error("Lapiz internal: the method parseReq must be implementated");
	}
	/**@type {IExpressParser<T>["resSendBody"]}*/
	resSendBody(endpoint, expressRes, lapizBackendRes)
	{
		throw new Error("[LAPIZ INTERNAL ERROR]: The method resHandler must be implementated");
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
	async parseReq(endpoint, req)
	{
		const urlParams = req.params;
		const headersParams = req.headers;
		
		const reqConfirmation = endpoint.declaration.request.safeParse({
			contentType: "application/void",
			urlParams,
			headersParams,
			body: undefined
		});

		if(reqConfirmation.error) return new Lapiz.Error.InvalidRequest(`Endpoint with name "${endpoint.name}" recibed a bad request in the backend side`);

		return {
			contentType: reqConfirmation.data.contentType,
			urlParams: reqConfirmation.data.urlParams,
			headersParams: reqConfirmation.data.headersParams,
			body: /**@type {LapizBackendReq<typeof endpoint>["body"]}*/(undefined)
		}
	}
	/**@type {IExpressParser<T>["resSendBody"]}*/
	async resSendBody(endpoint, expressRes, lapizBackendRes)
	{
		const resConfirmation = endpoint.declaration.response.safeParse(lapizBackendRes);
		if(resConfirmation.error) return new Error(`[LAPIZ ERROR]: The endpoint "${endpoint.name}" implemntation returns a incomplatible type with endpoint declaration`);
		
		ExpressHandler.resStatusAndHeadersParams(expressRes, resConfirmation.data);
		expressRes.send();
		return void 0;
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
	async parseReq(endpoint, req)
	{
		const urlParams = req.params;
		const headersParams = req.headers;
		const body = req.body;

		const reqConfirmation = endpoint.declaration.request.safeParse({
			contentType: req.headers["content-type"],
			urlParams,
			headersParams,
			body
		});

		if(reqConfirmation.error) return new Lapiz.Error.InvalidRequest(`Endpoint with name "${endpoint.name}" recibed a bad request in the backend side`);

		return /**@type {LapizBackendReq<typeof endpoint>}*/(reqConfirmation.data);
	}
	/**@type {IExpressParser<T>["resSendBody"]}*/
	async resSendBody(endpoint, expressRes, lapizBackendRes)
	{
		const resConfirmation = endpoint.declaration.response.safeParse(lapizBackendRes);
		if(resConfirmation.error) return new Error(`[LAPIZ ERROR]: The endpoint "${endpoint.name}" implemntation returns a incomplatible type with endpoint declaration`);
		
		ExpressHandler.resStatusAndHeadersParams(expressRes, resConfirmation.data);

		expressRes.send(/**@type {string}*/(resConfirmation.data.body));
		return void 0;
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
	async parseReq(endpoint, req)
	{
		const urlParams = req.params;
		const headersParams = req.headers;
		const body = req.body;

		const reqConfirmation = endpoint.declaration.request.safeParse({
			contentType: req.headers["content-type"],
			urlParams,
			headersParams,
			body
		});
		if(reqConfirmation.error) return new Lapiz.Error.InvalidRequest(`Endpoint with name "${endpoint.name}" recibed a bad request in the backend side`);

		return /**@type {LapizBackendReq<typeof endpoint>}*/(reqConfirmation.data);
	}
	/**@type {IExpressParser<T>["resSendBody"]}*/
	async resSendBody(endpoint, expressRes, lapizBackendRes)
	{
		const resConfirmation = endpoint.declaration.response.safeParse(lapizBackendRes);
		if(resConfirmation.error) return new Error(`[LAPIZ ERROR]: The endpoint "${endpoint.name}" implemntation returns a incomplatible type with endpoint declaration`);
		
		ExpressHandler.resStatusAndHeadersParams(expressRes, resConfirmation.data);

		expressRes.json(/**@type {Object}*/(lapizBackendRes.body));
		return void 0;
	}
}
/**
 * @class
 * @classdesc Class for parse a express req or res when its type are jpeg/image
 * @implements {IExpressParser<"image/jpeg">}
 * @extends {ExpressParser<"image/jpeg">}
 */
const ExpressParserJPEG = class extends ExpressParser
{
	constructor()
	{
		super("image/jpeg");
	}
	/**@type {IExpressParser<"image/jpeg">["parseReq"]}*/
	async parseReq(endpoint, req)
	{
		const urlParams = req.params;
		const headers = req.headers;
		const body = "__JPEG_IMAGE_SYMBOL__";

		const reqConfirmation = endpoint.declaration.request.safeParse({
			contentType: req.headers["content-type"],
			urlParams,
			headers,
			body
		});
		if(reqConfirmation.error) return new Lapiz.Error.InvalidRequest(`Endpoint with name "${endpoint.name}" recibed a bad request in the backend side`);
		
		const bodyValidation = await fileTypeStream(req);

		if(bodyValidation.fileType?.mime !== this.contentType)
		{
			return new Lapiz.Error.InvalidRequest(`Endpoint with name "${endpoint.name}" recibed a bad request in the backend side. The mime-type of req stream are not "image/jpeg"`);
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
	/**@type {IExpressParser<T>["resSendBody"]}*/
	async resSendBody(endpoint, expressRes, lapizBackendRes)
	{
		const stream = /**@type {Readable}*/(lapizBackendRes.body);

		const toParse = {
			contentType: lapizBackendRes.contentType,
			status: lapizBackendRes.status,
			headersParams: lapizBackendRes.headersParams,
			body: "__JPEG_IMAGE_SYMBOL__"
		};
		const resConfirmation = endpoint.declaration.response.safeParse(toParse);
		if(resConfirmation.error) return new Error(`[LAPIZ ERROR]: The endpoint "${endpoint.name}" implemntation returns a incomplatible type with endpoint declaration`);
		
		const fileType = await fileTypeStream(stream);
		if(fileType.fileType?.mime !== this.contentType)
		{
			return new Error(`[LAPIZ ERROR]: The endpoint "${endpoint.name}" implementations returns in body a stream with a mimetype !== "jpeg/image".`);
		}

		ExpressHandler.resStatusAndHeadersParams(expressRes, resConfirmation.data);

		fileType.pipe(expressRes);
		return void 0;
	}
}
/**
 * @class
 * @classdesc In this class compose the parsers
 * @template {ExpressParser<any>[]}P
 */
const ExpressHandler = class
{
	/**
	 * @param {express.Response} res
	 * @param {LapizBackendRes<Endpoint<string, string, Declaration<string>>>} lapizBackendRes
	 * @returns {void}
	 */
	static resStatusAndHeadersParams(res, lapizBackendRes)
	{
		res.status(lapizBackendRes.status);
		
		Object.entries(lapizBackendRes.headersParams).forEach(([key, value]) => {
			res.setHeader(key, value)
		});
		return void 0;
	}
	/**
	 * @param {express.Response} res
	 * @param {LapizError} err
	 * @returns {void}
	 */
	static sendErrorResponse(res, err)
	{
		if(err instanceof Lapiz.Error.InvalidRequest)
		{
			res.status(400); //bad request
		}
		else
		{
			res.status(500); //internal server error
		}

		res.setHeader("Content-Type", "application/json");
		res.send(Lapiz.Error.errorToJson(err));

		return void 0;
	}

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
	/**
	 * @template {ContentType}T
	 * @template {Endpoint<string, string, Declaration<string>>}E
	 * @param {T} contentType
	 * @param {E} endpoint
	 * @param {express.Response} expressRes
	 * @param {LapizBackendRes<E>} lapizBackendRes
	 */
	resSendBody(contentType, endpoint, expressRes, lapizBackendRes)
	{
		return this.getParser(contentType).resSendBody(endpoint, expressRes, lapizBackendRes)
	}
}
ExpressHandler.instance = new ExpressHandler(
	new ExpressParserVOID(),
	new ExpressParserTEXT(),
	new ExpressParserJSON(),
	new ExpressParserJPEG()
);

module.exports = ExpressHandler;
