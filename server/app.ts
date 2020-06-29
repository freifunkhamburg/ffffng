import _ from "lodash"
import auth, {BasicAuthCheckerCallback} from "http-auth"
import bodyParser from "body-parser"
import compress from "compression"
import express, {Express, NextFunction, Request, Response} from "express"
import {promises as fs} from "graceful-fs"

import {config} from "./config";

export const app: Express = express();

export function init(): void {
    const router = express.Router();

    // urls beneath /internal are protected
    const internalAuth = auth.basic(
        {
            realm: 'Knotenformular - Intern'
        },
        function (username: string, password: string, callback: BasicAuthCheckerCallback): void {
            callback(
                config.server.internal.active &&
                username === config.server.internal.user &&
                password === config.server.internal.password
            );
        }
    );
    router.use('/internal', auth.connect(internalAuth));

    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));

    const adminDir = __dirname + '/../admin';
    const clientDir = __dirname + '/../client';
    const templateDir = __dirname + '/templates';

    const jsTemplateFiles = [
        '/config.js'
    ];

    function usePromise(f: (req: Request, res: Response) => Promise<void>): void {
        router.use((req: Request, res: Response, next: NextFunction): void => {
            f(req, res).then(next).catch(next)
        });
    }

    router.use(compress());

    async function serveTemplate (mimeType: string, req: Request, res: Response): Promise<void> {
        const body = await fs.readFile(templateDir + '/' + req.path + '.template', 'utf8');

        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(_.template(body)({ config: config.client }));
    }

    usePromise(async (req: Request, res: Response): Promise<void> => {
        if (jsTemplateFiles.indexOf(req.path) >= 0) {
            await serveTemplate('application/javascript', req, res);
        }
    });

    router.use('/internal/admin', express.static(adminDir + '/'));
    router.use('/', express.static(clientDir + '/'));

    app.use(config.server.rootPath, router);
}
