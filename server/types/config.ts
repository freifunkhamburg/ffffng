import {ArrayField, Field, RawJsonField} from "sparkson"
import {ClientConfig, DurationMilliseconds, isString, toIsNewtype, Url} from "./shared";

export type Username = string & { readonly __tag: unique symbol };
export const isUsername = toIsNewtype(isString, "" as Username);

export type CleartextPassword = string & { readonly __tag: unique symbol };
export const isCleartextPassword = toIsNewtype(isString, "" as CleartextPassword);

export type PasswordHash = string & { readonly __tag: unique symbol };
export const isPasswordHash = toIsNewtype(isString, "" as PasswordHash);

export class UsersConfig {
    constructor(
        @Field("user") public username: Username,
        @Field("passwordHash") public passwordHash: PasswordHash,
    ) {
    }
}

export class LoggingConfig {
    constructor(
        @Field("enabled") public enabled: boolean,
        @Field("debug") public debug: boolean,
        @Field("profile") public profile: boolean,
    ) {
    }
}

export class InternalConfig {
    constructor(
        @Field("active") public active: boolean,
        @ArrayField("users", UsersConfig) public users: UsersConfig[],
    ) {
    }
}

export class SMTPAuthConfig {
    constructor(
        @Field("user") public user: Username,
        @Field("pass") public pass: CleartextPassword,
    ) {
    }
}

// For details see: https://nodemailer.com/smtp/
export class SMTPConfig {
    constructor(
        @Field("host") public host?: string,
        @Field("port") public port?: number,
        @Field("auth") public auth?: SMTPAuthConfig,
        @Field("secure") public secure?: boolean,
        @Field("ignoreTLS") public ignoreTLS?: boolean,
        @Field("requireTLS") public requireTLS?: boolean,
        @Field("opportunisticTLS") public opportunisticTLS?: boolean,
        @Field("name") public name?: string,
        @Field("localAddress") public localAddress?: string,
        @Field("connectionTimeout") public connectionTimeout?: DurationMilliseconds,
        @Field("greetingTimeout") public greetingTimeout?: DurationMilliseconds,
        @Field("socketTimeout") public socketTimeout?: DurationMilliseconds,
    ) {
    }
}

export class EmailConfig {
    constructor(
        @Field("from") public from: string,
        @RawJsonField("smtp") public smtp: SMTPConfig,
    ) {
    }
}

export class ServerMapConfig {
    constructor(
        @ArrayField("nodesJsonUrl", String) public nodesJsonUrl: Url[],
    ) {
    }
}

export class ServerConfig {
    constructor(
        @Field("baseUrl") public baseUrl: Url,
        @Field("port") public port: number,
        @Field("databaseFile") public databaseFile: string,
        @Field("peersPath") public peersPath: string,
        @Field("logging") public logging: LoggingConfig,
        @Field("internal") public internal: InternalConfig,
        @Field("email") public email: EmailConfig,
        @Field("map") public map: ServerMapConfig,
        @Field("rootPath", true, undefined, "/") public rootPath: string,
    ) {
    }
}

export class Config {
    constructor(
        @Field("server") public server: ServerConfig,
        @Field("client") public client: ClientConfig,
    ) {
    }
}
