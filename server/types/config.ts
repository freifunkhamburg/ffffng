import {ArrayField, Field, RawJsonField} from "sparkson"

export type Version = string;

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
