#! /usr/bin/env node
const chalk = require("chalk");
const boxen = require("boxen");
const yargs = require("yargs");
const figlet = require("figlet");
const path = require("path");
const fs = require("fs");
const registeredRoutes = require("../plugin");

const banner = chalk.yellow(figlet.textSync("ERC", { horizontalLayout: "full" }));

const usage = chalk.keyword("violet")(
    `${banner}\n Usage: erc -p <path>  -v <variable> -o <output> -f <output-file> -j <package.json> \n
    ${boxen(
        chalk.green(
            "\n" +
            "An express JS plugin to print registered routes of an expressJS app." +
            "\n"
        ),
        { padding: 1, borderColor: "green", dimBorder: true }
    )}\n`
);

const isOutputFileRequired = () => {
    const optionsIndex = process.argv.slice(2).indexOf("-o") !== -1 ? process.argv.slice(2).indexOf("-o") : process.argv.slice(2).indexOf("-output");
    switch (process.argv.slice(2)[optionsIndex + 1]) {
        case "print":
            return false;
        case "json":
            return true;
        default:
            console.log(chalk.red("Invalid output type."));
            return false;
    }
}

const options = yargs
    .usage(usage)
    .option("path", {
        alias: "p",
        describe: "Path to ExpressJS App file.",
        type: "string",
        demandOption: true,
    })
    .option("variable", {
        alias: "v",
        describe: "Variable name of ExpressJS App.",
        type: "string",
        demandOption: true,
    })
    .option("output", {
        alias: "o",
        describe: "Output type path.",
        type: "string",
        demandOption: true,
    })
    .option("output-file", {
        alias: "f",
        describe: "Output file path.",
        type: "string",
        demandOption: isOutputFileRequired(),
    })
    .option("packageJSON", {
        alias: "j",
        describe: "Path to package.json file.",
        type: "string",
        demandOption: true,
    })
    .example("erc -p ./app.js -v app -o print -j package.json", "Print all registered routes.")
    .example("erc --path ./app.js --variable app --output print --packageJSON package.json", "Print all registered routes.")
    .example("erc -p ./app.js -v app -o json -f routes.json -j package.json", "Write all registered routes into a JSON file.")
    .example("erc --path ./app.js --variable app --output json --output-file routes.json --packageJSON package.json", "Write all registered routes into a JSON file.")
    .argv;

let { path: _path, variable, output, outputFile, packageJSON } = options;

_path = path.resolve(_path);
packageJSON = require(path.resolve(packageJSON));
if (!fs.existsSync(_path)) {
    yargs.showHelp();
    console.log(`\n\n${chalk.red("File not found")} => ${_path}\n`);
    return;
}
let app = null;
const data = fs.readFileSync(_path, "utf8");
if (data.includes("module.exports")) {
    const imports = require(_path);
    if (Object.keys(imports).filter((key) => key === variable).length === 1) {
        app = imports[variable];
    } else {
        console.log(chalk.red(`Unable to import ExpressJS App variable properly.\n\nExport the app variable in ${_path} as ${data} \n\nmodule.exports = { ${variable} };`));
        return;
    }
} else {
    const update = `${data}\nmodule.exports = { ${variable} };`;
    const tempFileName = `${_path.substring(0, _path.lastIndexOf("/"))}/.temp.${Math.floor(Math.random() * 1000000)}.js`;
    fs.writeFileSync(tempFileName, update);
    const imports = require(path.resolve(tempFileName));
    app = imports[variable];
    fs.unlinkSync(tempFileName);
}
if (app == null) {
    console.log(chalk.red("Unable to link with Express App properly."));
    return;
}
const routes = registeredRoutes(app, packageJSON);
if (output) {
    switch (output) {
        case "json":
            fs.writeFileSync(outputFile, JSON.stringify({ routes }, null, 2));
            break;
        case "print":
            routes.map((route) => {
                const _route = route.split("   =>   ");
                const method = _route[0];
                const __path = _route[1];
                printRoute(method, __path);
            });
            break;
        default:
            console.log(chalk.red("Invalid output type."));
            break;
    }
} else {
    routes.map((route) => {
        const _route = route.split(" ");
        const method = _route[0];
        const __path = _route[1];
        printRoute(method, __path);
    });
}

function printRoute(method, __path) {
    switch (method) {
        case "GET":
            console.log(
                `${chalk.bgGrey(chalk.greenBright(method))}\t${chalk.whiteBright(
                    __path
                )}`
            );
            break;
        case "POST":
            console.log(
                `${chalk.bgGrey(chalk.blueBright(method))}\t${chalk.whiteBright(
                    __path
                )}`
            );
            break;
        case "PUT":
            console.log(
                `${chalk.bgGrey(chalk.yellowBright(method))}\t${chalk.whiteBright(
                    __path
                )}`
            );
            break;
        case "PATCH":
            console.log(
                `${chalk.bgGrey(chalk.magentaBright(method))}\t${chalk.whiteBright(
                    __path
                )}`
            );
            break;
        case "DELETE":
            console.log(
                `${chalk.bgGrey(chalk.redBright(method))}\t${chalk.whiteBright(
                    __path
                )}`
            );
            break;
        default:
            console.log(
                `${chalk.bgGrey(chalk.grayBright(method))}\t${chalk.whiteBright(
                    __path
                )}`
            );
            break;
    }
}