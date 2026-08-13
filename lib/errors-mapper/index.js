/**
 * @file
 * @source lib/errors-mapper/index.js
 * @description Catálogo central de errores HTTP estándar IANA (4xx y 5xx).
 * La key de cada entrada es el className (PascalCase) de la clase que se generará
 * en backend-error y frontend-error, y `type` es el identificador kebab-case que
 * viaja en el header "lapiz-backend-error". Los typedefs derivados del catálogo
 * alimentan la ingeniería de tipos de ambas implementaciones.
 */

/**
 * Errores 4xx (client errors) según el registro IANA, en orden de código
*/
const ERRORS_4XX = /**@type {const}*/({
	BadRequest: { code: 400, type: "bad-request" }, // Bad Request
	Unauthorized: { code: 401, type: "unauthorized" }, // Unauthorized
	PaymentRequired: { code: 402, type: "payment-required" }, // Payment Required
	Forbidden: { code: 403, type: "forbidden" }, // Forbidden
	NotFound: { code: 404, type: "not-found" }, // Not Found
	MethodNotAllowed: { code: 405, type: "method-not-allowed" }, // Method Not Allowed
	NotAcceptable: { code: 406, type: "not-acceptable" }, // Not Acceptable
	ProxyAuthenticationRequired: { code: 407, type: "proxy-authentication-required" }, // Proxy Authentication Required
	RequestTimeout: { code: 408, type: "request-timeout" }, // Request Timeout
	Conflict: { code: 409, type: "conflict" }, // Conflict
	Gone: { code: 410, type: "gone" }, // Gone
	LengthRequired: { code: 411, type: "length-required" }, // Length Required
	PreconditionFailed: { code: 412, type: "precondition-failed" }, // Precondition Failed
	ContentTooLarge: { code: 413, type: "content-too-large" }, // Content Too Large (ex "Payload Too Large")
	UriTooLong: { code: 414, type: "uri-too-long" }, // URI Too Long
	UnsupportedMediaType: { code: 415, type: "unsupported-media-type" }, // Unsupported Media Type
	RangeNotSatisfiable: { code: 416, type: "range-not-satisfiable" }, // Range Not Satisfiable
	ExpectationFailed: { code: 417, type: "expectation-failed" }, // Expectation Failed
	ImATeapot: { code: 418, type: "im-a-teapot" }, // I'm a teapot (soy una tetera)
	MisdirectedRequest: { code: 421, type: "misdirected-request" }, // Misdirected Request
	UnprocessableContent: { code: 422, type: "unprocessable-content" }, // Unprocessable Content (ex "Unprocessable Entity")
	Locked: { code: 423, type: "locked" }, // Locked (WebDAV)
	FailedDependency: { code: 424, type: "failed-dependency" }, // Failed Dependency (WebDAV)
	TooEarly: { code: 425, type: "too-early" }, // Too Early
	UpgradeRequired: { code: 426, type: "upgrade-required" }, // Upgrade Required
	PreconditionRequired: { code: 428, type: "precondition-required" }, // Precondition Required
	TooManyRequests: { code: 429, type: "too-many-requests" }, // Too Many Requests
	RequestHeaderFieldsTooLarge: { code: 431, type: "request-header-fields-too-large" }, // Request Header Fields Too Large
	UnavailableForLegalReasons: { code: 451, type: "unavailable-for-legal-reasons" }, // Unavailable For Legal Reasons
});

/**
 * Errores 5xx (server errors) según el registro IANA, en orden de código
 */
const ERRORS_5XX = /**@type {const}*/({
	InternalServerError: { code: 500, type: "internal-server-error" }, // Internal Server Error
	NotImplemented: { code: 501, type: "not-implemented" }, // Not Implemented
	BadGateway: { code: 502, type: "bad-gateway" }, // Bad Gateway
	ServiceUnavailable: { code: 503, type: "service-unavailable" }, // Service Unavailable
	GatewayTimeout: { code: 504, type: "gateway-timeout" }, // Gateway Timeout
	HttpVersionNotSupported: { code: 505, type: "http-version-not-supported" }, // HTTP Version Not Supported
	VariantAlsoNegotiates: { code: 506, type: "variant-also-negotiates" }, // Variant Also Negotiates
	InsufficientStorage: { code: 507, type: "insufficient-storage" }, // Insufficient Storage
	LoopDetected: { code: 508, type: "loop-detected" }, // Loop Detected
	NotExtended: { code: 510, type: "not-extended" }, // Not Extended
	NetworkAuthenticationRequired: { code: 511, type: "network-authentication-required" }, // Network Authentication Required
})

/**
 * Catálogo completo: primero todos los 4xx, luego todos los 5xx
 */
const ERRORS = /**@type {const}*/({ ...ERRORS_4XX, ...ERRORS_5XX });

/** @typedef {keyof typeof ERRORS} TErrorClassName */
/** @typedef {typeof ERRORS[keyof typeof ERRORS]["type"]} TErrorType */
/** @typedef {typeof ERRORS[keyof typeof ERRORS]["code"]} TErrorCode */
/** @typedef {typeof ERRORS_4XX[keyof typeof ERRORS_4XX]["type"]} TErrorType4xx */
/** @typedef {typeof ERRORS_5XX[keyof typeof ERRORS_5XX]["type"]} TErrorType5xx */

module.exports = ERRORS;
