/**
 * @file
 * @source lib/fetch-handler/index.js
 * @description This is a utility module for parse real req and res to user wraper. Is for Frontend
 */

import { toSafe } from "#lib/tools"
import Lapiz from "#lib/lapiz"

/**
 * @import Endpoint from "#lib/endpoint"
 * @import {Declaration} from "#lib/declaration"
 * @import {RouteParameters as UrlParams} from "express-serve-static-core"
 * @import {ContentType} from "#lib/lapiz"
 * @import {FrontCallerReq, FrontCallerRes} from "#lib/sdk"
 * @import {TLapizError as LapizError} from "#lib/lapiz-error"
 */

/**
 * @template {ContentType}T
 * @typedef {{
 *	contentType: T;
 *	fetchReq<E extends Endpoint<string, string, Declaration<string>>>(
 *		endpoint: E,
 *		request: FrontCallerReq<E>
 *	): ReturnType<typeof toSafe<Promise<Response>>>|LapizError;
 *	parseRes<E extends Endpoint<string, string, Declaration<string>>>(
 *		endpoint: E,
 *		response: Response
 *	): Promise<FrontCallerRes<E>|LapizError|Error>
 * }} IFetchHandler
 */

/**
 * @template {ContentType}T
 * @class
 * @classdesc This class is for extends in a utility class to meka fetchs and parse responses by ContentType
 * @abstract
 * @implements {IFetchHandler<T>}
 */
const FetchHandler = class
{
	/**
	 * @description Use the base url of endpoint and the url params and reconstruct the url for this call
	 * @template {string}Url
	 * @param {Url} baseUrl
	 * @param {UrlParams<Url>} urlParams
	 * @returns {string}
	 */
	static makeUrl(baseUrl, urlParams)
	{
		/**@type {string}*/
		let url = baseUrl;
		Object.entries(urlParams).forEach(([key, value]) =>
		{
			//TODO: quizas es un problema que el LSP aca diga que value puede ser undefined. No creo que lo sea
			url = url.replace(`/:${key}`, `/${value}`);
		});
		return url;
	}
	/**
	 * @description This static method is a helper for a FetchHandler implements... the body is apart for flexibility to send differen types of body
	 * @param {Endpoint<string, string, Declaration<string>>} endpoint
	 * @param {{
	 * 	headersParams: {[key:string]: string; };
	 * 	urlParams: UrlParams<string>;
	 * 	contentType: ContentType;
	 * }} frontCallerReq
	 * @param {undefined|string|File} body
	 * @returns {ReturnType<toSafe<ReturnType<fetch>>>}
	 */
	static fetch(endpoint, frontCallerReq, body)
	{
		const url = FetchHandler.makeUrl(endpoint.url, frontCallerReq.urlParams);
		return toSafe(fetch(url, {
			method: endpoint.method,
			headers: {
				"Content-Type": frontCallerReq.contentType,
				...frontCallerReq.headersParams,
			},
			body: body
		}));
	}
	/**
	 * @param {T} contentType
	 */
	constructor(contentType)
	{
		/**@constant @readonly @type{T}*/
		this.contentType = contentType;
	}
	/**
	 * @type {IFetchHandler<T>["fetchReq"]}
	 */
	fetchReq(endpoint, request)
	{
		throw new Error("Lapiz Internal: FetchHandler.fetchReq() must be implementated");
	}
	/**
	 * @type {IFetchHandler<T>["parseRes"]}
	 */
	parseRes(endpoint, response)
	{
		throw new Error("Lapiz Internal: FetchHandler.fetchReq() must be implementated");
	}
}

/**
 * @class
 * @classdesc handler for void fetchs
 * @implements {IFetchHandler<"application/void">}
 * @extends {FetchHandler<"application/void">}
 */
const FetchHandlerVOID = class extends FetchHandler
{
	constructor()
	{
		super("application/void");
	}
	/**@type{IFetchHandler<"application/void">["fetchReq"]}*/
	fetchReq(endpoint, request)
	{
		const reqConfirmation = endpoint.declaration.request.safeParse(request);
		if(reqConfirmation.error) return new Lapiz.Error("");
		if(reqConfirmation.data.contentType !== "application/void") throw new Error("[LAPIZ INTERNAL ERROR]: the application/void FetchHandler can't recibe other contentType in request");

		return FetchHandler.fetch(endpoint, reqConfirmation.data, undefined);
	}
	/**@type{IFetchHandler<"application/void">["parseRes"]}*/
	async parseRes(endpoint, response)
	{
		if(response.body !== null)
		{
			return new Error("[LAPIZ ERROR]: This Endpoint must send a void body but send bytes");
		}
		if(response.headers.get("Content-Type"))
		{
			return new Error("[LAPIZ ERROR]: This Endpoint must not send a Content-Type in headers because this is void. But send a mimetype: " + response.headers.get("Content-Type"));
		}
		const headers = Object.fromEntries(response.headers.entries());
		const toParse = {
			status: response.status,
			headers: {
				...headers,
				"Content-Type": "application/void"
			},
			body: void 0
		}

		const resConfirmation = endpoint.declaration.response.safeParse(toParse);
		if(resConfirmation.error)
		{
			return new Error(`[Lapiz ERROR]: Invalid response. Server endpoint allways must a spesific Response; ZodError: "${resConfirmation.error.message}"`);
		}
		return /**@type {FrontCallerRes<typeof endpoint>}*/({
			contentType: resConfirmation.data.contentType,
			status: resConfirmation.data.status,
			headersParams: resConfirmation.data.headersParams,
			body: void 0,
			fetchRes: response
		});
	}
}
/**
 * @class
 * @classdesc fetch handler for content-type "text/plain"
 * @implements {IFetchHandler<"text/plain">}
 * @extends {FetchHandler<"text/plain">}
 */
const FetchHandlerTEXT = class extends FetchHandler
{
	constructor()
	{
		super("text/plain");
	}
	/**@type {IFetchHandler<"text/plain">["fetchReq"]}*/
	fetchReq(endpoint, request)
	{
		const reqConfirmation = endpoint.declaration.request.safeParse(request);
		if(reqConfirmation.error) return new Lapiz.Error("");

		if(reqConfirmation.data.contentType !== "text/plain") throw new Error("[LAPIZ INTERNAL ERROR]: The text/plain FetchHandler can't recibe other contentType in request");
		return FetchHandler.fetch(endpoint, reqConfirmation.data, reqConfirmation.data.body)
	}
	/**@type {IFetchHandler<"text/plain">["parseRes"]}*/
	async parseRes(endpoint, response)
	{
		const safeBody = await toSafe(response.text());
		if(safeBody.error)
		{
			return new Lapiz.Error.ClientParseBody(safeBody.error);
		}
		const headers = Object.fromEntries(response.headers.entries());
		const toParse = {
			status: response.status,
			headers: headers,
			body: safeBody.result
		}
		const resConfirmation = endpoint.declaration.response.safeParse(toParse);
		if(resConfirmation.error)
		{
			return new Error(`[Lapiz ERROR]: Invalid response. Server endpoint allways must a spesific Response; ZodError: "${resConfirmation.error.message}"`);
		}
		return /**@type {FrontCallerRes<typeof endpoint>}*/({
			...resConfirmation.data,
			fetchRes: response
		});
	}
}

/**
 * @class
 * @classdesc Fetch handler for content-type "application/json"
 * @implements {IFetchHandler<"application/json">}
 * @extends {FetchHandler<"application/json">}
 */
const FetchHandlerJSON = class extends FetchHandler
{
	constructor()
	{
		super("application/json");
	}
	/**@type {IFetchHandler<"application/json">["fetchReq"]}*/
	fetchReq(endpoint, request)
	{
		const reqConfirmation = endpoint.declaration.request.safeParse(request);
		if(reqConfirmation.error) return new Lapiz.Error("");

		if(reqConfirmation.data.contentType !== "application/json") throw new Error("[LAPIZ INTERNAL ERROR]: The applciation/json FetchHandler can't recibe other contentType in request");
		return FetchHandler.fetch(endpoint, reqConfirmation.data, JSON.stringify(reqConfirmation.data.body));
	}
	/**@type {IFetchHandler<"application/json">["parseRes"]}*/
	async parseRes(endpoint, response)
	{
		const safeBody = await toSafe(response.json());
		if(safeBody.error)
		{
			return new Lapiz.Error.ClientParseBody(safeBody.error);
		}
		const headers = Object.fromEntries(response.headers.entries());
		
		const toParse = {
			status: response.status,
			headers: headers,
			body: safeBody.result
		}
		const resConfirmation = endpoint.declaration.response.safeParse(toParse);
		if(resConfirmation.error)
		{
			return new Error(`[Lapiz ERROR]: Invalid response. Server endpoint allways must a spesific Response; ZodError: "${resConfirmation.error.message}"`);
		}
		return /**@type {FrontCallerRes<typeof endpoint>}*/({
			...resConfirmation.data,
			fetchRes: response
		});
	}
}
/**
 * @class
 * @classdesc Fetch handler for content-type "jpeg/image"
 * @implements {IFetchHandler<"jpeg/image">}
 * @extends {FetchHandler<"jpeg/image">}
 */
const FetchHandlerJPEG = class extends FetchHandler
{
	constructor()
	{
		super("jpeg/image");
	}
	/**@type {IFetchHandler<"jpeg/image">["fetchReq"]}*/
	fetchReq(endpoint, request)
	{
		const body = /**@type {File}*/ (request.body);
		
		const toParse = {
			urlParams: request.urlParams,
			headers: {
				...request.headersParams,
				"Content-Type": request.contentType
			},
			body: "__JPEG_IMAGE_SYMBOL__"
		};
		
		const reqConfirmation = endpoint.declaration.request.safeParse(toParse);

		if(reqConfirmation.error) return new Lapiz.Error("");
		if(reqConfirmation.data.contentType !== "jpeg/image") throw new Error("[LAPIZ INTERNAL ERROR]: The jpeg/image FetchHandler can't recibe other contentType in request");
		if(body.type !== "jpeg/image") return new Lapiz.Error.InvalidRequest(); //TODO este error debe ser más espesífico para el usuario
		return FetchHandler.fetch(endpoint, reqConfirmation.data, body);
	}
	/**@type {IFetchHandler<"jpeg/image">["parseRes"]}*/
	async parseRes(endpoint, response)
	{
		const readableStream = response.body;
		if(readableStream === null)
		{
			return new Lapiz.Error("");
		}
		const headers = Object.fromEntries(response.headers.entries());
		
		const toParse = {
			status: response.status,
			headers: headers,
			body: "__JPEG_IMAGE_SYMBOL__"
		};

		const resConfirmation = endpoint.declaration.response.safeParse(toParse);
		if(resConfirmation.error)
		{
			return new Lapiz.Error("");
		}
		//No se puede garantizar que sea un jpeg/image programaticamente en frontend... hay que asumir eso y solo retonrar el ReadabeStream
		return /**@type {FrontCallerRes<typeof endpoint>}*/({
			...resConfirmation.data,
			body: readableStream
		});
	}
}

/**
 * @template {FetchHandler<any>[]}H
 * @class
 * @classdesc This class is a wraper from a list of fetch-handlers. Is a swith
 */
const FetchHandlerByContentType = class
{
	/**
	 * @param {H} handlers
	 */
	constructor(...handlers)
	{
		/**
		 * @constant
		 * @readonly
		 * @private
		 * @template {ContentType}CT
		 * @type{Map<ContentType, FetchHandler<ContentType>>}
		 */
		this.handlersMap = new Map();

		handlers.forEach(h =>
		{
			this.handlersMap.set(h.contentType, h);
		});
	}
	/**
	 * @private
	 * @template {ContentType}T
	 * @param {T} contentType
	 * @returns {IFetchHandler<T>}
	 */
	getHandler(contentType)
	{
		const handler = this.handlersMap.get(contentType);
		if(!handler)
		{
			throw new Error("Lapiz internal: not implemented yet this content-type");
		}
		return /**@type {IFetchHandler<T>}*/(handler);
	}
	/**
	 * @template {ContentType}T
	 * @template {Endpoint<string, string, Declaration<string>>}E
	 * @param {T} contentType
	 * @param {E} endpoint
	 * @param {FrontCallerReq<E>} request
	 * @return {ReturnType<IFetchHandler<T>["fetchReq"]>}
	 */
	fetchReq(contentType, endpoint, request)
	{
		return this.getHandler(contentType).fetchReq(/**@type{any}*/(endpoint), request);
	}
	/**
	 * @template {ContentType}T
	 * @param {T} contentType
	 * @param {Endpoint<string, string, Declaration<string>>} endpoint
	 * @param {Response} response
	 * @return {ReturnType<IFetchHandler<T>["parseRes"]>}
	 */
	parseRes(contentType, endpoint, response)
	{
		return this.getHandler(contentType).parseRes(endpoint, response)
	}
}

FetchHandlerByContentType.instance = new FetchHandlerByContentType(
	new FetchHandlerVOID(),
	new FetchHandlerTEXT(),
	new FetchHandlerJSON(),
	new FetchHandlerJPEG()
);
export default FetchHandlerByContentType;
