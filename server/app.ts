import _ from "lodash";
import auth, { BasicAuthCheckerCallback } from "http-auth";
import authConnect from "http-auth-connect";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import compress from "compression";
import express, { Express, NextFunction, Request, Response } from "express";
import { promises as fs } from "graceful-fs";

import { config } from "./config";
import type { CleartextPassword, PasswordHash, Username } from "./types";
import { isString } from "./types";
import Logger from "./logger";
import { HttpHeader, HttpStatusCode, MimeType } from "./shared/utils/http";

export const app: Express = express();

/**
 * Used to have some password comparison in case the user does not exist to avoid timing attacks.
 */
const INVALID_PASSWORD_HASH: PasswordHash =
    "$2b$05$JebmV1q/ySuxa89GoJYlc.6SEnj1OZYBOfTf.TYAehcC5HLeJiWPi" as PasswordHash;

/**
 * Trying to implement a timing safe string compare.
 *
 * TODO: Write tests for timing.
 */
function timingSafeEqual<T extends string>(a: T, b: T): boolean {
    const lenA = a.length;
    const lenB = b.length;

    // Greater than 0 for differing strings.
    let different = Math.abs(lenA - lenB);

    // Make sure b is always the same length as a. Use slice to try avoiding optimizations.
    b = (different === 0 ? b.slice() : a.slice()) as T;

    for (let i = 0; i < lenA; i += 1) {
        different += Math.abs(a.charCodeAt(i) - b.charCodeAt(i));
    }

    return different === 0;
}

async function isValidLogin(
    username: Username,
    password: CleartextPassword
): Promise<boolean> {
    if (!config.server.internal.active) {
        return false;
    }

    let passwordHash: PasswordHash | undefined = undefined;

    // Iterate over all users every time to reduce risk of timing attacks.
    for (const userConfig of config.server.internal.users) {
        if (timingSafeEqual(username, userConfig.username)) {
            passwordHash = userConfig.passwordHash;
        }
    }

    // Always compare some password even if the user does not exist to reduce risk of timing attacks.
    const isValidPassword = await bcrypt.compare(
        password,
        passwordHash || INVALID_PASSWORD_HASH
    );

    // Make sure password is only considered valid is user exists and therefor passwordHash is not undefined.
    return isString(passwordHash) && isValidPassword;
}

export function init(): void {
    const router = express.Router();

    // urls beneath /internal are protected
    const internalAuth = auth.basic(
        {
            realm: "Knotenformular - Intern",
        },
        function (
            username: string,
            password: string,
            callback: BasicAuthCheckerCallback
        ): void {
            isValidLogin(username as Username, password as CleartextPassword)
                .then((result) => callback(result))
                .catch((err) => {
                    Logger.tag("login").error(err);
                });
        }
    );
    router.use("/internal", authConnect(internalAuth));

    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));

    const adminDir = __dirname + "/../admin";
    const clientDir = __dirname + "/../client";
    const templateDir = __dirname + "/templates";

    const jsTemplateFiles = ["/config.js"];

    function usePromise(
        f: (req: Request, res: Response) => Promise<void>
    ): void {
        router.use((req: Request, res: Response, next: NextFunction): void => {
            f(req, res).then(next).catch(next);
        });
    }

    router.use(compress());

    async function serveTemplate(
        mimeType: MimeType,
        req: Request,
        res: Response
    ): Promise<void> {
        const body = await fs.readFile(
            templateDir + "/" + req.path + ".template",
            "utf8"
        );

        res.writeHead(HttpStatusCode.OK, {
            [HttpHeader.CONTENT_TYPE]: mimeType,
        });
        res.end(_.template(body)({ config: config.client }));
    }

    usePromise(async (req: Request, res: Response): Promise<void> => {
        if (jsTemplateFiles.indexOf(req.path) >= 0) {
            await serveTemplate(MimeType.APPLICATION_JSON, req, res);
        }
    });

    router.use("/internal/admin", express.static(adminDir + "/"));
    router.use("/", express.static(clientDir + "/"));

    app.use(config.server.rootPath, router);
}
