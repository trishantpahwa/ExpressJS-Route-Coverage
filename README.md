# ExpressJS-Route-Coverage

    An express JS plugin to print registered routes of an expressJS app.

This project is inspired by the following [Stack Overflow Answer](https://stackoverflow.com/a/46397967/6072570).

> Later I realised it should have been better to refer this link [List All Routes in express app](https://github.com/expressjs/express/issues/3308).

> Supports `express: 3.x`, `4.x`, and `5.x`.

![Made with love in India](https://madewithlove.now.sh/in?heart=true&template=for-the-badge) `&& ` ![javascript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)

![npm](https://img.shields.io/npm/dw/expressjs-route-coverage?style=for-the-badge)
[![code-sandbox](https://img.shields.io/badge/Codesandbox-000000?style=for-the-badge&logo=CodeSandbox&logoColor=white)](https://codesandbox.io/p/devbox/expressjs-route-coverage-forked-jfxnf9)

## Installation

### CLI

    # On your terminal, run the following command:
    npm i -g expressjs-route-coverage

### ExpressJS application development plugin

    # On your terminal, run the following command:
    npm i -D expressjs-route-coverage
    # Add the following script to your `package.json` file:
    "scripts": {
        "log-routes": "erc -p <path> -v <variable> -o <output> [-f <output-file>]"
    }

> A good way is to add it before the mocha command in your `package.json` file.

```
    "scripts": {
        "test": "erc -p <path> -v <variable> -o print && mocha",
    }
```

### ExpressJS application middleware plugin

    # On your terminal, run the following command:
    `npm i -g expressjs-route-coverage`
    or
    `npm i -D expressjs-route-coverage`

## Usage

### CLI

```
_____   ____     ____
| ____| |  _ \   / ___|
|  _|   | |_) | | |
| |___  |  _ <  | |___
|_____| |_| \_\  \____|

Usage: erc -p <path> -v <variable> -o <output> [-f <output-file>]

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                                                                          │
│   An express JS plugin to print registered routes of an expressJS app.   │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘


Options:
      --version      Show version number                               [boolean]
      --help         Show help                                         [boolean]
  -p, --path         Path to ExpressJS app file.              [string] [required]
  -v, --variable     Variable name of ExpressJS app.          [string] [required]
  -o, --output       Output type: print | json.               [string] [required]
  -f, --output-file  Output file path (required when --output is json).  [string]
  -j, --packageJSON  Path to package.json (deprecated, no longer required). [string]

Examples:
  erc -p ./app.js -v app -o print                         Print all registered routes.
  erc -p ./app.js -v app -o json -f routes.json           Write all registered routes into a JSON file.
```

> Example

    erc -p ./app.js -v app -o print

    erc -p ./app.js -v app -o json -f routes.json

![Example](example.svg)

### ExpressJS application plugin

    In your ExpressJS application, add the following code:

```js
const express = require('express');
const { logRegisteredRoutes } = require('expressjs-route-coverage');

const app = express();
// ... register routes ...

console.log(logRegisteredRoutes(app));
```

## Express version support

| Version | Flat routes | Nested routers | Route parameters | Array paths |
|---------|-------------|----------------|-----------------|-------------|
| 3.x     | ✅          | —              | ✅              | —           |
| 4.x     | ✅          | ✅             | ✅              | —           |
| 5.x     | ✅          | ✅             | ✅              | ✅          |

> **Note (Express 5.x):** Parameter names in router *mount prefixes* (e.g. `app.use('/orgs/:orgId', router)`) are shown as `:param0`, `:param1`, … because Express 5 compiles them into opaque closures. Parameter names in *route paths* (e.g. `router.get('/users/:id', ...)`) are always preserved correctly.

## To-Do:

-   [ ] Add output option to allow pipelining with other commands.

Developed by [Trishant Pahwa](https://trishantpahwa.me) at [KodeKrew Technologies](https://kodekrew.com).
