# Lapiz

Lapiz (or `lek-apis`) is a class library for standardizing API endpoints on both the backend and frontend.

## Installation

```bash
npm i lapiz
```

---

## ApiCaller (frontend)

An `ApiCaller` is an abstract class you must extend to define how each API endpoint is called from the frontend. You must implement three methods:

- `buildReq(input)` — builds the request object from the input.
- `parseResFromRaw(rawRes, extra)` — parses the raw response. Returns a `LapizRes` or a `LapizFrontendError.UnexpectedResponse`.
- `parseOutput(res)` — transforms the `LapizRes` into the final output that the SDK consumer will receive.

```javascript
import ApiCaller from "lapiz/api-caller"
import LapizFrontendError from "lapiz/frontend-error"
import { hostName } from "./constants.js"

/**
 * @typedef {"create-pig"} Name
 * @typedef {"/create-pig/:name"} Route
 * @typedef {{ name: string; age: number; }} Input
 * @typedef {{ success: true; error: null; } | { success: false; error: Error; }} Output
 * @typedef {{ "content-type": "application/json"; routeParams: { name: string }; body: { age: number } }} Req
 * @typedef {{ status: 200 | 500 }} Res
 */

/**
 * @import {IApiCaller} from "lapiz/api-caller"
 */

/**
 * @class
 * @extends {ApiCaller.PUT<Name, Route, Input, Output, Req, Res>}
 * @implements {IApiCaller<Name, Route, Input, Output, Req, Res>}
 */
const CreatePig = class extends ApiCaller.PUT
{
	constructor()
	{
		super("create-pig", hostName, "/create-pig/:name");
	}

	/** @type {IApiCaller<Name, Route, Input, Output, Req, Res>["buildReq"]} */
	buildReq(input)
	{
		return {
			"content-type": "application/json",
			routeParams: { name: input.name },
			body: { age: input.age }
		}
	}

	/** @type {IApiCaller<Name, Route, Input, Output, Req, Res>["parseResFromRaw"]} */
	parseResFromRaw(rawResponse, { contentType, body })
	{
		if(rawResponse.status === 200) return { status: 200 };
		if(rawResponse.status === 500) return { status: 500 };
		return new LapizFrontendError.UnexpectedResponse("Unexpected server response");
	}

	/** @type {IApiCaller<Name, Route, Input, Output, Req, Res>["parseOutput"]} */
	parseOutput(res)
	{
		return res.status === 200
			? { success: true, error: null }
			: { success: false, error: new Error("Failed to create pig") };
	}
}

export default CreatePig;
```

There are four variants depending on the HTTP method: `ApiCaller.GET`, `ApiCaller.POST`, `ApiCaller.PUT`, `ApiCaller.DELETE`.

---

## SDK (frontend)

The `SDK` groups multiple `ApiCaller`s and exposes a `call(name, input)` method with automatically inferred typing.

```javascript
import SDK from "lapiz/sdk";
import CreatePig from "./create-pig.js"

const sdk = new SDK(
	new CreatePig(),
	// ...more callers
);

(async () =>
{
	const res = await sdk.call("create-pig", { name: "oink", age: 66 });

	if(res.error)
	{
		console.error(res.error); // LapizFrontendError with the problem
	}
	else
	{
		console.log(res.output); // { success: true; error: null } | { success: false; error: Error }
	}
})();
```

---

## RouteHandler (backend)

The `RouteHandler` is the server-side equivalent of the `ApiCaller`. You must implement three methods:

- `parseInput(expressReq)` — extracts and validates the input from the Express request. Returns the input or a `LapizBackendError.BadRequest`.
- `handle(input, extra)` — contains the endpoint logic. Returns the output.
- `buildRes(output, extra)` — builds the `LapizRes` response object from the output.

```javascript
const RouteHandler = require("lapiz/route-handler");
const LapizBackendError = require("lapiz/backend-error");

/**
 * The types (N, R, I, O, Req, Res) are the same as in the frontend ApiCaller.
 *
 * @implements {IRouteHandler<N, R, I, O, Req, Res>}
 * @extends {RouteHandler.PUT<N, R, I, O, Req, Res>}
 */
const CreatePig = class extends RouteHandler.PUT
{
	constructor()
	{
		super("create-pig", "/create-pig/:name");
	}

	parseInput(rawExpressReq)
	{
		if(typeof rawExpressReq.body.age !== "number")
		{
			return new LapizBackendError.BadRequest("The 'age' field must be a number");
		}
		return {
			name: rawExpressReq.params.name,
			age: rawExpressReq.body.age
		};
	}

	async handle(input)
	{
		await myDatabase.insertPig(input.name, input.age);
		return { success: true, error: null };
	}

	buildRes(output)
	{
		return {
			status: output.success ? 200 : 500
		};
	}
}

module.exports = CreatePig;
```

There are four variants: `RouteHandler.GET`, `RouteHandler.POST`, `RouteHandler.PUT`, `RouteHandler.DELETE`.

---

## Router (backend)

The `Router` takes a list of `RouteHandler`s and registers them on an Express application.

```javascript
const Router = require("lapiz/router");
const express = require("express");
const CreatePig = require("./create-pig.js");

const router = new Router(
	new CreatePig(),
	// ...more handlers
);

const app = express();
router.addToApp(app);
app.listen(3000, () => { console.log("Listening on localhost:3000") });
```

---

## Notes on body types

When the `content-type` is `application/json`, `text/plain`, or there is no body (`void`), the `Req` and `Res` types are identical between frontend and backend.

For binary content (`BinaryMimeType`), the `body` type differs:

| Side | `body` type in `Req` | `body` type in `Res` |
|------|----------------------|----------------------|
| Frontend | `BodyInit` (`File`, `Blob`, etc.) | `ReadableStream` |
| Backend | `import("node:stream").Readable` | `import("node:stream").Readable` |

---

## Error handling

All errors that `sdk.call()` can return are instances of `LapizFrontendError`:

- `LapizFrontendError.FetchError` — the `fetch` call failed (no connection, CORS, etc.).
- `LapizFrontendError.ServerError` — the server returned the `lapiz-backend-error` header.
- `LapizFrontendError.ParseError` — error while parsing the response body.
- `LapizFrontendError.UnexpectedResponse` — `parseResFromRaw` returned an unhandled response.

#### Important notes:

Currently, the GET and DELETE methods in routeHandler do not throw an error if they receive a body. Be sure not to use either contentType or body in these methods, as this can lead to silent errors.
