import {ArrayField, Field, RawJsonField} from "sparkson"
import {ClientConfig} from "./shared";

// TODO: Replace string types by more specific types like URL, Password, etc.

export type Username = string;
export type CleartextPassword = string;
export type PasswordHash = string;

export class UsersConfig {
    constructor(
        @Field("user") public username: Username,
        @Field("passwordHash") public passwordHash: PasswordHash,
    ) {}
}

export class LoggingConfig {
    constructor(
        @Field("enabled") public enabled: boolean,
        @Field("debug") public debug: boolean,
        @Field("profile") public profile: boolean,
    ) {}
}

export class InternalConfig {
    constructor(
        @Field("active") public active: boolean,
        @ArrayField("users", UsersConfig) public users: UsersConfig[],
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

export class Config {
    constructor(
        @Field("server") public server: ServerConfig,
        @Field("client") public client: ClientConfig,
    ) {}
}
