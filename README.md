# Lapiz

Lapiz (`lapiz`) is a class library for standardizing API endpoints on both the backend and frontend.

## Installation

```bash
npm i lapiz
```

---

## Quick error handling pattern

In both `RouteHandler.handle()` and `ApiCaller.parseOutput()`, instead of returning the full response, you can return a quick error:

```javascript
// RouteHandler.handle()
return RouteHandler.Error.BadRequest("Invalid input");
// or
return RouteHandler.Error.Forbidden("Not authorized");
// or
return RouteHandler.Error.InternalServerError("Database failed");

// ApiCaller.parseOutput()
return new ApiCaller.Error.BadResponse("Unexpected response");
```

---

## ApiCaller (frontend)

An `ApiCaller` is an abstract class you extend to define how each API endpoint is called from the frontend. You must implement two methods:

- `buildReq(input)` — builds the request object from the input
- `parseOutput(rawRes, extra)` — parses the raw response and returns the final output

### Error pipeline

When you call `sdk.call("endpoint", input)`, Lapiz handles errors automatically:

```
fetch()
  ├─ Network/fetch fails       → FetchError
  ├─ Server responded with error headers (bad-request, forbidden, internal-server-error)
  │                            → the corresponding LapizFrontendError
  ├─ Response body can't be parsed (JSON/text invalid)
  │                            → ParseError
  └─ All good                  → parseOutput() is called
                                    └─ If response is unexpected → BadResponse()
```

**Key point:** By the time `parseOutput()` is called, all typical errors have already been filtered. The only error `parseOutput()` should return is `BadResponse()` when the server response doesn't match what you expect.

### Example

```javascript
import ApiCaller from "lapiz/api-caller"
import { hostName } from "./constants.js"

/**
 * @typedef {"create-pig"} Name
 * @typedef {"/create-pig/:name"} Route
 * @typedef {{ name: string; age: number; }} Input
 * @typedef {{ success: true; error: null; } | { success: false; error: Error; }} Output
 * @typedef {{ "content-type": "application/json"; routeParams: { name: string }; body: { age: number } }} Req
 * @typedef {{ status: 200 | 500 }} Res
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

	/** @type {IApiCaller<Name, Route, Input, Output, Req, Res>["parseOutput"]} */
	parseOutput(rawResponse, extra)
	{
		// If we get here, the response has status 200 and valid content-type
		// Just check that the body is what we expect
		if(extra.contentType !== "application/json")
		{
			return new ApiCaller.Error.BadResponse("Expected JSON response");
		}

		const body = extra.body;
		if(typeof body.success !== "boolean")
		{
			return new ApiCaller.Error.BadResponse("Unexpected body shape");
		}

		// Happy path - return the parsed output
		return { success: body.success, error: null };
	}
}

export default CreatePig;
```

There are four variants depending on the HTTP method: `ApiCaller.GET`, `ApiCaller.POST`, `ApiCaller.PUT`, `ApiCaller.DELETE`.

---

## RouteHandler (backend)

The `RouteHandler` is the server-side equivalent of the `ApiCaller`. You must implement three methods:

- `parseInput(expressReq)` — extracts and validates the input from the Express request. Returns the input or a quick error (`RouteHandler.Error.BadRequest`).
- `handle(input, extra)` — contains the endpoint logic. Returns the output OR a quick error (`RouteHandler.Error.BadRequest`, `RouteHandler.Error.Forbidden`, `RouteHandler.Error.InternalServerError`).
- `buildRes(output, extra)` — builds the `LapizRes` response object from the output.

### Quick errors

In `handle()`, instead of returning the output, you can return a quick error:

```javascript
async handle(input, extra)
{
	const existingPig = await db.findPig(input.name);
	if(existingPig)
	{
		return RouteHandler.Error.BadRequest("Pig already exists");
	}

	if(!extra.expressReq.user?.isAdmin)
	{
		return RouteHandler.Error.Forbidden("Only admins can create pigs");
	}

	const result = await db.insertPig(input.name, input.age);
	if(!result)
	{
		return RouteHandler.Error.InternalServerError("Database error");
	}

	return { success: true }; // Success output
}
```

### Example

```javascript
const RouteHandler = require("lapiz/route-handler");

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
			return new RouteHandler.Error.BadRequest("The 'age' field must be a number");
		}
		return {
			name: rawExpressReq.params.name,
			age: rawExpressReq.body.age
		};
	}

	async handle(input, extra)
	{
		// Business logic - can return output OR a quick error
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

## Error types

### Backend errors (`LapizBackendError`)

Used in `RouteHandler`:

- `RouteHandler.Error.BadRequest` — 400, invalid input
- `RouteHandler.Error.Forbidden` — 403, not authorized
- `RouteHandler.Error.InternalServerError` — 500, unexpected server failure

### Frontend errors (`LapizFrontendError`)

Returned by `sdk.call()`:

- `ApiCaller.Error.FetchError` — network/fetch failed (no connection, CORS, timeout)
- `ApiCaller.Error.BadRequest` — server returned 400
- `ApiCaller.Error.Forbidden` — server returned 403
- `ApiCaller.Error.InternalServerError` — server returned 500
- `ApiCaller.Error.ParseError` — couldn't parse the response body
- `ApiCaller.Error.BadResponse` — `parseOutput()` detected an unexpected response format

---

## Notes on body types

When the `content-type` is `application/json`, `text/plain`, or there is no body (`void`), the `Req` and `Res` types are identical between frontend and backend.

For binary content (`BinaryMimeType`), the `body` type differs:

| Side | `body` type in `Req` | `body` type in `Res` |
|------|----------------------|----------------------|
| Frontend | `BodyInit` (`File`, `Blob`, etc.) | `ReadableStream` |
| Backend | `import("node:stream").Readable` | `import("node:stream").Readable` |

---

## Additional notes

Currently, the GET and DELETE methods in routeHandler do not throw an error if they receive a body. Be sure not to use either contentType or body in these methods, as this can lead to silent errors.