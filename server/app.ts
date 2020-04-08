import _ from "lodash"
import auth, {BasicAuthCheckerCallback} from "http-auth"
import bodyParser from "body-parser"
import compress from "compression"
import express, {Express, NextFunction, Request, Response} from "express"
import fs from "graceful-fs"

const config = require('./config').config

const app: Express = express();

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

router.use(compress());

function serveTemplate (mimeType: string, req: Request, res: Response, next: NextFunction): void {
    return fs.readFile(templateDir + '/' + req.path + '.template', 'utf8', function (err, body) {
        if (err) {
            return next(err);
        }

        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(_.template(body)({ config: config.client }));

        return null; // to suppress warning
    });
}

router.use(function (req: Request, res: Response, next: NextFunction): void {
    if (jsTemplateFiles.indexOf(req.path) >= 0) {
        return serveTemplate('application/javascript', req, res, next);
    }
    return next();
});

router.use('/internal/admin', express.static(adminDir + '/'));
router.use('/', express.static(clientDir + '/'));

app.use(config.server.rootPath, router);

export default app;
