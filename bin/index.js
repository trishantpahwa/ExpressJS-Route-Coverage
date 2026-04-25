#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const boxen = require('boxen');
const yargs = require('yargs');
const figlet = require('figlet');
const path = require('path');
const fs = require('fs');
const registeredRoutes = require('../plugin');

const banner = chalk.yellow(figlet.textSync('ERC', { horizontalLayout: 'full' }));

const usage = chalk.keyword('violet')(
  `${banner}\n Usage: erc -p <path> -v <variable> -o <output> [-f <output-file>]\n\n${boxen(
    chalk.green('\n An express JS plugin to print registered routes of an expressJS app.\n'),
    { padding: 1, borderColor: 'green', dimBorder: true }
  )}\n`
);

const options = yargs
  .usage(usage)
  .help('help')
  .option('path', {
    alias: 'p',
    describe: 'Path to ExpressJS app file.',
    type: 'string',
    demandOption: true,
  })
  .option('variable', {
    alias: 'v',
    describe: 'Variable name of the ExpressJS app.',
    type: 'string',
    demandOption: true,
  })
  .option('output', {
    alias: 'o',
    describe: 'Output type: print | json',
    type: 'string',
    demandOption: true,
  })
  .option('output-file', {
    alias: 'f',
    describe: 'Output file path (required when --output is json).',
    type: 'string',
  })
  .option('packageJSON', {
    alias: 'j',
    describe: 'Path to package.json (deprecated — no longer required).',
    type: 'string',
  })
  .example('erc -p ./app.js -v app -o print', 'Print all registered routes.')
  .example('erc -p ./app.js -v app -o json -f routes.json', 'Write all registered routes to a JSON file.')
  .argv;

const { path: _path, variable, output, outputFile } = options;

if (output === 'json' && !outputFile) {
  console.log(chalk.red('Output file (-f / --output-file) is required when output type is json.'));
  yargs.showHelp();
  process.exit(1);
}

const resolvedPath = path.resolve(_path);
if (!fs.existsSync(resolvedPath)) {
  console.log(`\n${chalk.red('File not found')} => ${resolvedPath}\n`);
  process.exit(1);
}

let app = null;
const source = fs.readFileSync(resolvedPath, 'utf8');

if (source.includes('module.exports')) {
  const imports = require(resolvedPath);
  if (Object.prototype.hasOwnProperty.call(imports, variable)) {
    app = imports[variable];
  } else {
    console.log(chalk.red(
      `Export '${variable}' not found in ${resolvedPath}.\n\nMake sure the app is exported:\n\n  module.exports = { ${variable} };`
    ));
    process.exit(1);
  }
} else {
  const tempFile = path.join(
    path.dirname(resolvedPath),
    `.temp.${Date.now()}.${Math.floor(Math.random() * 1e6)}.js`
  );
  try {
    fs.writeFileSync(tempFile, `${source}\nmodule.exports = { ${variable} };`);
    app = require(path.resolve(tempFile))[variable];
  } finally {
    try { fs.unlinkSync(tempFile); } catch (_) {}
  }
}

if (app == null) {
  console.log(chalk.red(`Unable to read the Express app from variable '${variable}'.`));
  process.exit(1);
}

const routes = registeredRoutes(app, null);

switch (output) {
  case 'json':
    fs.writeFileSync(outputFile, JSON.stringify({ routes }, null, 2));
    break;
  case 'print':
    routes.forEach(route => {
      const sep = '   =>   ';
      const idx = route.indexOf(sep);
      printRoute(route.slice(0, idx), route.slice(idx + sep.length));
    });
    break;
  default:
    console.log(chalk.red(`Invalid output type '${output}'. Use 'print' or 'json'.`));
    process.exit(1);
}

function printRoute(method, routePath) {
  const methodColors = {
    GET:    chalk.greenBright,
    POST:   chalk.blueBright,
    PUT:    chalk.yellowBright,
    PATCH:  chalk.magentaBright,
    DELETE: chalk.redBright,
  };
  const color = methodColors[method] || chalk.gray;
  console.log(`${chalk.bgGrey(color(method))}\t${chalk.whiteBright(routePath)}`);
}
