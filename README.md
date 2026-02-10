# Lapiz

> An elegant TypeScript/JavaScript library for building type-safe APIs with Zod and Express

Lapiz (Lek - Api'z) allows you to define API endpoints declaratively, automatically generating validations for both backend and strongly-typed SDKs for the frontend, eliminating validation logic duplication.

## 🚀 Features

- **End-to-end type-safety**: Automatic backend validation and complete frontend typing
- **Declarative**: Define your endpoints once, use them everywhere
- **Zod-powered**: Leverage Zod's power for robust validation schemas
- **Express integration**: Seamlessly couples with your existing Express application
- **Auto-generated SDK**: Fully typed HTTP client for your frontend

## 📦 Installation

```bash
npm install lapiz
```

## 🎯 Quick Start

### 1. Declare Your Endpoints

Create a file to centralize all your endpoint definitions (e.g., `endpoints.js`):

```javascript
const Lapiz = require("lapiz");
const { z } = require("zod");

const createUserEndpoint = Lapiz.declareEndpoint.put(
  "create-user",
  "/create/user/:username",
  {
    request: z.object({
      contentType: Lapiz.contentTypeSchemas.applicationJson,
      urlParams: z.object({
        username: z.string()
      }),
      headersParams: z.object({
        "my-extra-param": z.union([z.literal("opt1"), z.literal("opt2")])
      }),
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        age: z.number().int().positive(),
        gender: z.union([z.literal("F"), z.literal("M")])
      })
    }),
    response: z.union([
      z.object({
        contentType: Lapiz.contentTypeSchemas.void,
        status: z.literal(200),
        headersParams: z.object({}),
        body: z.undefined()
      }),
      z.object({
        contentType: Lapiz.contentTypeSchemas.textPlain,
        status: z.literal(500),
        headersParams: z.object({}),
        body: z.union([
          z.literal("unexpected error"),
          z.literal("a typical error")
        ])
      })
    ])
  }
);

const deleteUserEndpoint = Lapiz.declareEndpoint.delete(
  "delete-user",
  "/delete/user/:user_id",
  {
    // ... similar definition
  }
);

module.exports = { createUserEndpoint, deleteUserEndpoint };
```

### 2. Implement the Backend

```javascript
const LapizBackend = require("lapiz/backend");
const { createUserEndpoint, deleteUserEndpoint } = require("./endpoints");

const createUserImplementation = LapizBackend.implements(
  createUserEndpoint,
  async ({ contentType, urlParams, headersParams, body }, { expressReq, expressRes }) => {
    // Your business logic here
    const user = await database.createUser({
      username: urlParams.username,
      ...body
    });

    return {
      contentType: "void",
      status: 200,
      headersParams: {},
      body: undefined
    };
  }
);

const deleteUserImplementation = LapizBackend.implements(
  deleteUserEndpoint,
  // ... your implementation
);

const backend = new LapizBackend(
  createUserImplementation,
  deleteUserImplementation
);

// Integrate with Express
const express = require("express");
const app = express();

app.use(backend.router);

app.listen(3000, () => {
  console.log("API running on port 3000");
});
```

### 3. Use the SDK on the Frontend

```javascript
import SDK from "lapiz/sdk";
import { createUserEndpoint, deleteUserEndpoint } from "./endpoints";

const sdk = new SDK(createUserEndpoint, deleteUserEndpoint);

// Type-safe call with full autocompletion
const result = await sdk.call("create-user", {
  contentType: "application/json",
  urlParams: { username: "JohnLennon" },
  headersParams: { "my-extra-param": "opt2" },
  body: {
    email: "john@lennon.com",
    password: "secure123",
    age: 44,
    gender: "M"
  }
});

if (result.error) {
  alert(result.error.message);
} else {
  console.log("User created successfully");
}
```

## 📚 Documentation

### Endpoint Declaration

The `Lapiz.declareEndpoint` method has variants for each HTTP method:

- `Lapiz.declareEndpoint.get(name, url, declarations)`
- `Lapiz.declareEndpoint.post(name, url, declarations)`
- `Lapiz.declareEndpoint.put(name, url, declarations)`
- `Lapiz.declareEndpoint.delete(name, url, declarations)`

#### Parameters

**`name`** (string)  
Unique endpoint identifier. Choose descriptive names to avoid conflicts.

**`url`** (string)  
Endpoint path in Express format. Supports dynamic parameters with `:`:  
Example: `/users/:userId/posts/:postId`

**`declarations`** (object)  
Object with two properties: `request` and `response`

##### Request Schema

```javascript
request: z.object({
  contentType: Lapiz.contentTypeSchemas.applicationJson, // or textPlain, void, imageJpeg
  urlParams: z.object({ /* URL parameters */ }),
  headersParams: z.object({ /* custom headers */ }),
  body: z.object({ /* request body */ })
})
```

**Available Content-Type values:**
- `Lapiz.contentTypeSchemas.applicationJson` → Body: `ZodType<Object>`
- `Lapiz.contentTypeSchemas.textPlain` → Body: `ZodType<string>`
- `Lapiz.contentTypeSchemas.void` → Body: `z.undefined()`
- `Lapiz.contentTypeSchemas.imageJpeg` → Body: `Lapiz.symbols.imageJpeg`

> ⚠️ **Note**: `GET` and `DELETE` methods must use `contentType: void` by default due to the nature of these HTTP methods

##### Response Schema

```javascript
response: z.union([
  z.object({
    contentType: Lapiz.contentTypeSchemas.applicationJson,
    status: z.literal(200), // or use Lapiz.resStatusSchemas
    headersParams: z.object({}),
    body: z.object({ /* response data */ })
  }),
  z.object({
    contentType: Lapiz.contentTypeSchemas.textPlain,
    status: z.literal(500),
    headersParams: z.object({}),
    body: z.string()
  })
])
```

**Tip:** Use `z.union()` to define multiple possible responses (success, errors, etc.)

### Client SDK

```javascript
import SDK from "lapiz/sdk";

const sdk = new SDK(endpoint1, endpoint2, endpoint3);

const result = await sdk.call("endpoint-name", requestData);
```

The SDK provides:
- ✅ Full TypeScript/JavaScript autocompletion
- ✅ Automatic request validation
- ✅ Response typing
- ✅ Structured error handling

### Backend

```javascript
const LapizBackend = require("lapiz/backend");

const implementation = LapizBackend.implements(
  endpoint,
  async (request, { expressReq, expressRes }) => {
    // request contains: contentType, urlParams, headersParams, body
    // Don't use expressRes.send(), expressRes.json() or expressRes.status()
    
    return {
      contentType: "application/json",
      status: 200,
      headersParams: {},
      body: { success: true }
    };
  }
);

const backend = new LapizBackend(implementation1, implementation2);

// backend.router is an express.Router
app.use(backend.router);
```

> ⚠️ **Important**: Don't use Express response methods directly (`res.send()`, `res.json()`, `res.status()`). Lapiz handles responses automatically.

## 🛡️ Error Handling

Lapiz uses error objects instead of exceptions for flow control:

```javascript
if (result.error) {
  // Specific error handling
  if (result.error instanceof Lapiz.Error.InvalidRequest) {
    console.log("Invalid request");
  } else if (result.error instanceof Lapiz.Error.Fetch) {
    console.log("Network error");
  }
  
  // Or use the generic message
  alert(result.error.message);
}
```

### Custom Error Messages

```javascript
Lapiz.setCustomErrorMessages({
  invalidRequest: "You have entered an invalid request",
  fetch: "Server connection error",
  clientParseBody: "Error processing response",
  unexpected: "An unexpected error occurred"
});
```

### Error Types

- `Lapiz.Error.InvalidRequest` - Request doesn't comply with schema
- `Lapiz.Error.Fetch` - Network or connection error
- `Lapiz.Error.ClientParseBody` - Error parsing response
- `Lapiz.Error.Unexpected` - Unanticipated errors

> 💡 **Philosophy**: `throw` is reserved for programmer exceptions that must be fixed. Expected errors are handled through the `result.error` object.

## ⚠️ Important Considerations

### Custom Headers

The `headersParams` should always be written in **lowercase** since HTTP headers are not case-sensitive:

```javascript
headersParams: z.object({
  "authorization": z.string(),  // ✅ Correct
  "Authorization": z.string()   // ❌ May cause issues
})
```

It's recommended to use them sparingly and prefer empty objects when possible.

### Beta Status

This is a beta version. It's recommended to:
- Perform thorough testing before production
- Report any errors or unexpected behavior
- Review generated validations

## 📄 License

MIT

## 🙋 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- [Add other contact channels]

---

Made with ❤️ for developers who value type-safety
