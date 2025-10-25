const {z} = require("zod");

//TODO lo de validar los urlParams con el shape es nesesario pero no hay que hacerlo acá, sinó en el builder
//de esta forma evitamos trabajo innesesario de validación en runtime y esto queda como una librería netamente
//declarativa

//Route helper
/*** @template {string}R @typedef {import("express-serve-static-core").RouteParameters<R>} RouteParams*/

//Headers types
/**
 * @typedef {{ [key: string]: string; } & { "Content-Type"? : never}} HeadersVoidDef
 * @typedef {{ "Content-Type": "text/plain"; [key:string]: string; }} HeadersTextPlainDef
 * @typedef {{ "Content-Type": "application/json"; [key:string]: string; }} HeadersApplicationJsonDef
 * @typedef {HeadersVoidDef|HeadersTextPlainDef|HeadersApplicationJsonDef} HeadersDef
 */

//Body types
/**
 * @typedef {void} BodyVoidDef
 * @typedef {string} BodyTextPlainDef
 * @typedef {object} BodyApplicationJsonDef
 * @typedef {BodyVoidDef|BodyTextPlainDef|BodyApplicationJsonDef} BodyDef
 */

//Request types (url template for url params)
/*** @template {string}URL @typedef {{ headers: HeadersVoidDef, body: BodyVoidDef, urlParams: RouteParams<URL> }} RequestVoidDef*/
/*** @template {string}URL @typedef {{ headers: HeadersTextPlainDef, body: BodyTextPlainDef, urlParams: RouteParams<URL> }} RequestTextPlainDef*/
/*** @template {string}URL @typedef {{ headers: HeadersApplicationJsonDef, body: BodyApplicationJsonDef, urlParams: RouteParams<URL> }} RequestApplicationJsonDef*/
/*** @template {string}URL @typedef {RequestVoidDef<URL>|RequestTextPlainDef<URL>|RequestApplicationJsonDef<URL>} RequestDef*/

//Response types
/**
 * @typedef {{ status: number; headers: HeadersVoidDef; body: BodyVoidDef }} ResponseVoidDef
 * @typedef {{ status: number; headers: HeadersTextPlainDef; body: BodyTextPlainDef }} ResponseTextPlainDef
 * @typedef {{ status: number; headers: HeadersApplicationJsonDef; body: BodyApplicationJsonDef}} ResponseApplicationJsonDef
 * @typedef {ResponseVoidDef|ResponseTextPlainDef|ResponseApplicationJsonDef} ResponseDef
 */

//Declarations
/*** @template {string}URL @typedef {{ request: z.ZodType<RequestVoidDef<URL>>; response: z.ZodType<ResponseDef>; }} VoidReqDeclarations*/
/*** @template {string}URL @typedef {{ request: z.ZodType<RequestDef<URL>>; response: z.ZodType<ResponseDef>; }|VoidReqDeclarations<URL>} Declarations*/

/*** @template {string}URL @template {VoidReqDeclarations<URL>}D @typedef { D & { constants: { url: URL; method: "GET"|"DELETE"; } } } ReqVoidEndpoint*/
/*** @template {string}URL @template {Declarations<URL>}D @typedef { D & { constants: { url: URL; method: "GET"|"PUT"|"POST"|"DELETE"; } } } Endpoint*/

/*** @typedef {{<URL extends string, D extends VoidReqDeclarations<URL>>(url:URL, declarations:D):ReqVoidEndpoint<URL, D> }} VoidRequestDeclarationMethod*/
/*** @typedef {{<URL extends string, D extends Declarations<URL>>(url:URL, declarations:D):Endpoint<URL, D> }} DeclarationMethod*/

const Lapiz = class
{
	static declareEndpoint = {
		/**@type {VoidRequestDeclarationMethod}*/
		get(url, declarations)
		{
			return { ...declarations, constants: { url, method: "GET" } };
		},
		/**@type {DeclarationMethod}*/
		put(url, declarations)
		{
			return { ...declarations, constants: { url, method: "PUT" }};
		},
		/**@type {DeclarationMethod}*/
		post(url, declarations)
		{
			return { ...declarations, constants: { url, method: "POST" } };
		},
		/**@type {VoidRequestDeclarationMethod}*/
		delete(url, declarations)
		{
			return { ...declarations, constants: { url, method: "DELETE" } };
		}
	}
	static contentTypes =
	{
		textPlain: z.literal("text/plain"),
		applicationJson: z.literal("application/json")
	};
	static statusList =
	{
		notFound_404: z.literal(404),
		//etc
	}

	constructor(){}
};

//Prueba
const ep = Lapiz.declareEndpoint.get("/hola/:mundo", {
	request: z.object({
		headers: z.object({
			extraParam: z.string(),
			extraParam2: z.string()
		}),
		urlParams: z.object({
			mundo: z.string(),
			hola: z.boolean()
		}),
		body : z.void(),
	}),
	response: z.union([
		z.object({
			status: z.literal(500),
			headers: z.object({
				"Content-Type": Lapiz.contentTypes.applicationJson
			}),
			body: z.object({
				param1: z.string(),
				param2: z.number()
			})
		}),
		z.object({
			status: z.literal(200),
			headers: z.object({
				"Content-Type": Lapiz.contentTypes.textPlain
			}),
			body: z.string()
		})
	])
});

module.exports = Lapiz;
