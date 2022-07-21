import commandLineArgs from "command-line-args"
import commandLineUsage from "command-line-usage"
import fs from "graceful-fs"
import url from "url"
import {parse} from "sparkson"
import {Config, Url, Version} from "./types"

// @ts-ignore
export let config: Config = {};
export let version: Version = "unknown" as Version;

export function parseCommandLine(): void {
    const commandLineDefs = [
        {name: 'help', alias: 'h', type: Boolean, description: 'Show this help'},
        {name: 'config', alias: 'c', type: String, description: 'Location of config.json'},
        {name: 'version', alias: 'v', type: Boolean, description: 'Show ffffng version'}
    ];

    let commandLineOptions;
    try {
        commandLineOptions = commandLineArgs(commandLineDefs);
    } catch (e: any) {
        if (e.message) {
            console.error(e.message);
        } else {
            console.error(e);
        }
        console.error('Try \'--help\' for more information.');
        process.exit(1);
    }

    const packageJsonFile = __dirname + '/../package.json';
    if (fs.existsSync(packageJsonFile)) {
        version = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8')).version;
    }

    function usage() {
        console.log(commandLineUsage([
            {
                header: 'ffffng - ' + version + ' - Freifunk node management form',
                optionList: commandLineDefs
            }
        ]));
    }

    if (commandLineOptions.help) {
        usage();
        process.exit(0);
    }

    if (commandLineOptions.version) {
        console.log('ffffng - ' + version);
        process.exit(0);
    }

    if (!commandLineOptions.config) {
        usage();
        process.exit(1);
    }

    const configJSONFile = commandLineOptions.config;
    let configJSON = {};

    if (fs.existsSync(configJSONFile)) {
        configJSON = JSON.parse(fs.readFileSync(configJSONFile, 'utf8'));
    } else {
        console.error('config.json not found: ' + configJSONFile);
        process.exit(1);
    }

    config = parse(Config, configJSON);

    function stripTrailingSlash(url: Url): Url {
        return url.endsWith("/")
            ? url.substring(0, url.length - 1) as Url
            : url;
    }

    config.server.baseUrl = stripTrailingSlash(config.server.baseUrl);
    config.client.map.mapUrl = stripTrailingSlash(config.client.map.mapUrl);

    config.server.rootPath = url.parse(config.server.baseUrl).pathname || "/";
    config.client.rootPath = config.server.rootPath;
}
