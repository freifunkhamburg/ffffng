import commandLineArgs from "command-line-args"
import commandLineUsage from "command-line-usage"
import fs from "graceful-fs"
import url from "url"
import {ArrayField, Field, parse, RawJsonField} from "sparkson"

// TODO: Replace string types by more specific types like URL, Password, etc.

export class LoggingConfig {
    constructor(
        @Field("directory") public directory: string,
        @Field("debug") public debug: boolean,
        @Field("profile") public profile: boolean,
        @Field("logRequests") public logRequests: boolean,
    ) {}
}

export class InternalConfig {
    constructor(
        @Field("active") public active: boolean,
        @Field("user") public user: string,
        @Field("password") public password: string,
    ) {}
}

export class EmailConfig {
    constructor(
        @Field("from") public from: string,

        // For details see: https://nodemailer.com/2-0-0-beta/setup-smtp/
        @RawJsonField("smtp") public smtp: any, // TODO: Better types!
    ) {}
}

export class ServerMapConfig {
    constructor(
        @ArrayField("nodesJsonUrl", String) public nodesJsonUrl: string[],
    ) {}
}

export class ServerConfig {
    constructor(
        @Field("baseUrl") public baseUrl: string,
        @Field("port") public port: number,

        @Field("databaseFile") public databaseFile: string,
        @Field("peersPath") public peersPath: string,

        @Field("logging") public logging: LoggingConfig,
        @Field("internal") public internal: InternalConfig,
        @Field("email") public email: EmailConfig,
        @Field("map") public map: ServerMapConfig,

        @Field("rootPath", true, undefined, "/") public rootPath: string,
    ) {}
}

export class CommunityConfig {
    constructor(
        @Field("name") public name: string,
        @Field("domain") public domain: string,
        @Field("contactEmail") public contactEmail: string,
        @ArrayField("sites", String) public sites: string[],
        @ArrayField("domains", String) public domains: string[],
    ) {}
}

export class LegalConfig {
    constructor(
        @Field("privacyUrl", true) public privacyUrl?: string,
        @Field("imprintUrl", true) public imprintUrl?: string,
    ) {}
}

export class ClientMapConfig {
    constructor(
        @Field("mapUrl") public mapUrl: string,
    ) {}
}
export class MonitoringConfig {
    constructor(
        @Field("enabled") public enabled: boolean,
    ) {}
}

export class Coords {
    constructor(
        @Field("lat") public lat: number,
        @Field("lng") public lng: number,
    ) {}
}

export class CoordsSelectorConfig {
    constructor(
        @Field("lat") public lat: number,
        @Field("lng") public lng: number,
        @Field("defaultZoom") public defaultZoom: number,
        @RawJsonField("layers") public layers: any, // TODO: Better types!
    ) {}
}

export class OtherCommunityInfoConfig {
    constructor(
        @Field("showInfo") public showInfo: boolean,
        @Field("showBorderForDebugging") public showBorderForDebugging: boolean,
        @ArrayField("localCommunityPolygon", Coords) public localCommunityPolygon: Coords[],
    ) {}
}

export class ClientConfig {
    constructor(
        @Field("community") public community: CommunityConfig,
        @Field("legal") public legal: LegalConfig,
        @Field("map") public map: ClientMapConfig,
        @Field("monitoring") public monitoring: MonitoringConfig,
        @Field("coordsSelector") public coordsSelector: CoordsSelectorConfig,
        @Field("otherCommunityInfo") public otherCommunityInfo: OtherCommunityInfoConfig,
        @Field("rootPath", true, undefined, "/") public rootPath: string,
    ) {}
}

export class Config {
    constructor(
        @Field("server") public server: ServerConfig,
        @Field("client") public client: ClientConfig
    ) {}
}

function parseCommandLine(): {config: Config, version: string} {
    const commandLineDefs = [
        { name: 'help', alias: 'h', type: Boolean, description: 'Show this help' },
        { name: 'config', alias: 'c', type: String, description: 'Location of config.json' },
        { name: 'version', alias: 'v', type: Boolean, description: 'Show ffffng version' }
    ];

    let commandLineOptions;
    try {
        commandLineOptions = commandLineArgs(commandLineDefs);
    } catch (e) {
        console.error(e.message);
        console.error('Try \'--help\' for more information.');
        process.exit(1);
    }

    const packageJsonFile = __dirname + '/../package.json';
    let version = 'unknown';
    if (fs.existsSync(packageJsonFile)) {
        version = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8')).version;
    }

    function usage () {
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

    const config: Config = parse(Config, configJSON);

    function stripTrailingSlash(url: string): string {
        return url.endsWith("/") ? url.substr(0, url.length - 1) : url;
    }

    config.server.baseUrl = stripTrailingSlash(config.server.baseUrl);
    config.client.map.mapUrl = stripTrailingSlash(config.client.map.mapUrl);

    config.server.rootPath = url.parse(config.server.baseUrl).pathname || "/";
    config.client.rootPath = config.server.rootPath;

    return {
        config,
        version
    }
}

const {config, version} = parseCommandLine();

export {config};
export {version};

