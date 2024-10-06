# ExpressJS-Route-Coverage

    An express JS plugin to print registered routes of an expressJS app.

This project is inspired by the following [Stack Overflow Answer](https://stackoverflow.com/a/46397967/6072570).

> Later I realised it should have been better to refer this link [List All Routes in express app](https://github.com/expressjs/express/issues/3308).

> Only supports `express: ^4.x.x`.

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
        "log-routes": "erc -p <path> -v <variable> -o <output> -f <output-file> -j <package.json>"
    }

> A good way is to add it before the mocha command in your `package.json` file.

```
    "scripts": {
        "test": "erc -p <path> -v <variable> -o <output> -f <output-file> -j <package-json> && mocha",
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

Usage: erc -p <path>  -v <variable> -o <output> -f <output-file> -j <package.json>

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
  -p, --path         Path to ExpressJS App file.             [string] [required]
  -v, --variable     Variable name of ExpressJS App.         [string] [required]
  -o, --output       Output type path.                       [string] [required]
  -f, --output-file  Output file path.                                  [string]
  -j, --packageJSON  Path to package.json file.              [string] [required]

Examples:
  erc -p ./app.js -v app -o print -j        Print all registered routes.
  package.json
  erc --path ./app.js --variable app        Print all registered routes.
  --output print --packageJSON
  package.json
  erc -p ./app.js -v app -o json -f         Write all registered routes into a
  routes.json -j package.json               JSON file.
  erc --path ./app.js --variable app        Write all registered routes into a
  --output json --output-file routes.json   JSON file.
  --packageJSON package.json
```

> Example

    erc -p ../sample-app/app.js -v app -o json -f ../sample-app/routes.json -j ../sample-app/package.json

    # or

    npm run log-routes -p ../sample-app/app.js -v app -o json -f ../sample-app/routes.json -j ../sample-app/package.json

[![Example](example.svg)]

### ExpressJS application plugin

    In your ExpressJS application, add the following code at the end of the file:

```
    const express = require('express');
    const { logRegisteredRoutes } = require('expressjs-route-coverage');
    const packageJSON = require("../sample-app/package.json");
    .
    .

    const app = express();
    .
    .
    .
    console.log(logRegisteredRoutes(app, packageJSON));
```

## To-Do:

-   [ ] Add output option to allow pipelining with other commands.

Developed by [Trishant Pahwa](https://trishantpahwa.me) at [KodeKrew Technologies](https://kodekrew.com).

