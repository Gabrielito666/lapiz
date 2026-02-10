# Lapiz

> Una librería TypeScript/JavaScript elegante para construir APIs type-safe con Zod y Express

Lapiz (Lek - Api'z) te permite definir endpoints de API de forma declarativa, generando automáticamente validaciones tanto en el backend como SDKs fuertemente tipados para el frontend, eliminando la duplicación de lógica de validación.

## 🚀 Características

- **Type-safe de extremo a extremo**: Validación automática en backend y tipado completo en frontend
- **Declarativo**: Define tus endpoints una sola vez, úsalos en todas partes
- **Basado en Zod**: Aprovecha el poder de Zod para esquemas de validación robustos
- **Integración con Express**: Se acopla perfectamente a tu aplicación Express existente
- **SDK autogenerado**: Cliente HTTP completamente tipado para tu frontend

## 📦 Instalación

```bash
npm install lapiz
```

## 🎯 Inicio Rápido

### 1. Declara tus Endpoints

Crea un archivo para centralizar todas tus definiciones de endpoints (por ejemplo, `endpoints.js`):

```javascript
const Lapiz = require("lapiz");
const { z } = require("zod");

const createUserEndpoint = Lapiz.declareEndpoint.put(
  "crear-usuario",
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
    // ... definición similar
  }
);

module.exports = { createUserEndpoint, deleteUserEndpoint };
```

### 2. Implementa el Backend

```javascript
const LapizBackend = require("lapiz/backend");
const { createUserEndpoint, deleteUserEndpoint } = require("./endpoints");

const createUserImplementation = LapizBackend.implements(
  createUserEndpoint,
  async ({ contentType, urlParams, headersParams, body }, { expressReq, expressRes }) => {
    // Tu lógica de negocio aquí
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
  // ... tu implementación
);

const backend = new LapizBackend(
  createUserImplementation,
  deleteUserImplementation
);

// Integra con Express
const express = require("express");
const app = express();

app.use(backend.router);

app.listen(3000, () => {
  console.log("API running on port 3000");
});
```

### 3. Usa el SDK en el Frontend

```javascript
import SDK from "lapiz/sdk";
import { createUserEndpoint, deleteUserEndpoint } from "./endpoints";

const sdk = new SDK(createUserEndpoint, deleteUserEndpoint);

// Llamada type-safe con autocompletado completo
const result = await sdk.call("crear-usuario", {
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
  console.log("Usuario creado exitosamente");
}
```

## 📚 Documentación

### Declaración de Endpoints

El método `Lapiz.declareEndpoint` tiene variantes para cada método HTTP:

- `Lapiz.declareEndpoint.get(name, url, declarations)`
- `Lapiz.declareEndpoint.post(name, url, declarations)`
- `Lapiz.declareEndpoint.put(name, url, declarations)`
- `Lapiz.declareEndpoint.delete(name, url, declarations)`

#### Parámetros

**`name`** (string)  
Identificador único del endpoint. Elije nombres descriptivos para evitar conflictos.

**`url`** (string)  
Ruta del endpoint en formato Express. Soporta parámetros dinámicos con `:`:  
Ejemplo: `/users/:userId/posts/:postId`

**`declarations`** (object)  
Objeto con dos propiedades: `request` y `response`

##### Request Schema

```javascript
request: z.object({
  contentType: Lapiz.contentTypeSchemas.applicationJson, // o textPlain, void, imageJpeg
  urlParams: z.object({ /* parámetros de la URL */ }),
  headersParams: z.object({ /* headers personalizados */ }),
  body: z.object({ /* cuerpo de la petición */ })
})
```

**Tipos de Content-Type disponibles:**
- `Lapiz.contentTypeSchemas.applicationJson` → Body: `ZodType<Object>`
- `Lapiz.contentTypeSchemas.textPlain` → Body: `ZodType<string>`
- `Lapiz.contentTypeSchemas.void` → Body: `z.undefined()`
- `Lapiz.contentTypeSchemas.imageJpeg` → Body: `Lapiz.symbols.imageJpeg`

> ⚠️ **Nota**: Los métodos `GET` y `DELETE` deben usar obligatoriamente `contentType: void`

##### Response Schema

```javascript
response: z.union([
  z.object({
    contentType: Lapiz.contentTypeSchemas.applicationJson,
    status: z.literal(200), // o usa Lapiz.resStatusSchemas
    headersParams: z.object({}),
    body: z.object({ /* datos de respuesta */ })
  }),
  z.object({
    contentType: Lapiz.contentTypeSchemas.textPlain,
    status: z.literal(500),
    headersParams: z.object({}),
    body: z.string()
  })
])
```

**Tip:** Usa `z.union()` para definir múltiples posibles respuestas (éxito, errores, etc.)

### SDK del Cliente

```javascript
import SDK from "lapiz/sdk";

const sdk = new SDK(endpoint1, endpoint2, endpoint3);

const result = await sdk.call("endpoint-name", requestData);
```

El SDK proporciona:
- ✅ Autocompletado completo de TypeScript/JavaScript
- ✅ Validación automática de requests
- ✅ Tipado de respuestas
- ✅ Manejo de errores estructurado

### Backend

```javascript
const LapizBackend = require("lapiz/backend");

const implementation = LapizBackend.implements(
  endpoint,
  async (request, { expressReq, expressRes }) => {
    // request contiene: contentType, urlParams, headersParams, body
    // No uses expressRes.send(), expressRes.json() o expressRes.status()
    
    return {
      contentType: "application/json",
      status: 200,
      headersParams: {},
      body: { success: true }
    };
  }
);

const backend = new LapizBackend(implementation1, implementation2);

// backend.router es un express.Router
app.use(backend.router);
```

> ⚠️ **Importante**: No uses métodos de respuesta de Express directamente (`res.send()`, `res.json()`, `res.status()`). Lapiz maneja las respuestas automáticamente.

## 🛡️ Manejo de Errores

Lapiz usa objetos de error en lugar de excepciones para el control de flujo:

```javascript
if (result.error) {
  // Manejo específico de errores
  if (result.error instanceof Lapiz.Error.InvalidRequest) {
    console.log("Request inválida");
  } else if (result.error instanceof Lapiz.Error.Fetch) {
    console.log("Error de red");
  }
  
  // O usa el mensaje genérico
  alert(result.error.message);
}
```

### Mensajes de Error Personalizados

```javascript
Lapiz.setCustomErrorMessages({
  invalidRequest: "Has ingresado una petición inválida",
  fetch: "Error de conexión al servidor",
  clientParseBody: "Error al procesar la respuesta",
  unexpected: "Ha ocurrido un error inesperado"
});
```

### Tipos de Error

- `Lapiz.Error.InvalidRequest` - Request no cumple con el schema
- `Lapiz.Error.Fetch` - Error de red o conexión
- `Lapiz.Error.ClientParseBody` - Error al parsear la respuesta
- `Lapiz.Error.Unexpected` - Errores no anticipados

> 💡 **Filosofía**: `throw` está reservado para excepciones del programador que deben corregirse. Los errores esperados se manejan mediante el objeto `result.error`.

## ⚠️ Consideraciones Importantes

### Headers Personalizados

Los `headersParams` deben escribirse siempre en **minúsculas** ya que los headers HTTP no son case-sensitive:

```javascript
headersParams: z.object({
  "authorization": z.string(),  // ✅ Correcto
  "Authorization": z.string()   // ❌ Puede causar problemas
})
```

Se recomienda usarlos con moderación y preferir objetos vacíos cuando sea posible.

### jsDocs

Esta biblioteca se vuelve mucho más potente con un archivo jsconfig.json que comprueba los tipos con TypeScript.

### Estado Beta

Esta es una versión beta. Se recomienda:
- Realizar pruebas exhaustivas antes de producción
- Reportar cualquier error o comportamiento inesperado
- Revisar las validaciones generadas

## 📄 Licencia

MIT

## 🙋 Soporte

Si encuentras algún problema o tienes preguntas:
- Abre un issue en GitHub

---

Hecho con ❤️ para desarrolladores que valoran la type-safety
