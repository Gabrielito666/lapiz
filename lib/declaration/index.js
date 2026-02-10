/**
 * @file
 * @source lib/declaration/index.js
 * @description Is a Types module. is for Declaration type.
 * Now is not a javascript module... is just for typedef declarations. But in the future can be a class
 */
/**
 * @import {z} from "zod"
 * @import {RouteParameters as UrlParams} from "express-serve-static-core"
 * @import {ContentType} from "#lib/lapiz"
 */

/**
 * @template {ContentType}T
 * @typedef {(
 *	T extends "application/void" ? z.ZodUndefined :
 *	T extends "text/plain" ? z.ZodType<string> :
 *	T extends "application/json" ? z.ZodObject<any> :
 *	T extends "image/jpeg" ? z.ZodLiteral<"__JPEG_IMAGE_SYMBOL__"> :
 *	never
 * )} BodySchema
 */

/**
 * @template {string}Url
 * @template {ContentType}T
 * @typedef {z.ZodObject<{
 * 	contentType: z.ZodType<T>;
 *	urlParams: z.ZodType<UrlParams<Url>>;
 *	headersParams: z.ZodObject<{[key:string]: z.ZodType<string>}>;
 *	body: BodySchema<T>;
 * }>} ReqSchema
 */
/**
 * @template {ContentType}T
 * @typedef {z.ZodObject<{
 *	contentType: z.ZodType<T>;
 *	status: z.ZodType<number>;
 *	headersParams: z.ZodObject<{[key: string]: z.ZodType<string>}>;
 *	body: BodySchema<T>;
 * }>} ResSchema
 */
/**
 * @template {string}Url
 * @typedef {(
 * 	ReqSchema<Url, "application/void"> |
 * 	ReqSchema<Url, "text/plain"> |
 * 	ReqSchema<Url, "application/json"> |
 * 	ReqSchema<Url, "image/jpeg">
 * )} ReqDec
 */
/**
 * @typedef {(
 *	ResSchema<"application/void"> |
 *	ResSchema<"text/plain"> |
 *	ResSchema<"application/json"> |
 *	ResSchema<"image/jpeg">
 * )} ResDec
 */

/**
 * @template {string}Url
 * @typedef {{
 *	request: ReqDec<Url>;
 *	response: ResDec;
 * }} IDeclaration
 */

/**
 * Alias from interface. In the future can be a class
 * @template {string}Url
 * @typedef {IDeclaration<Url>} Declaration
 */

/**
 * Declaration for GET and DELETE methods
 * @template {string}Url
 * @typedef {{
 *	request: ReqSchema<Url, "application/void">;
 *	response: ResDec;
 * }} VoidReqDeclaration
 */

export {};
