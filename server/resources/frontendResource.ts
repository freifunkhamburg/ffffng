import { promises as fs } from "graceful-fs";

import ErrorTypes from "../utils/errorTypes";
import Logger from "../logger";
import * as Resources from "../utils/resources";
import { Request, Response } from "express";

const indexHtml = __dirname + "/../../client/index.html";

export function render(req: Request, res: Response): void {
    const data = Resources.getData(req);

    fs.readFile(indexHtml, "utf8")
        .then((body) =>
            Resources.successHtml(
                res,
                body.replace(
                    /<body/,
                    "<script>window.__nodeToken = '" +
                        data.token +
                        "';</script><body"
                )
            )
        )
        .catch((err) => {
            Logger.tag("frontend").error(
                "Could not read file: ",
                indexHtml,
                err
            );
            return Resources.error(res, {
                data: "Internal error.",
                type: ErrorTypes.internalError,
            });
        });
}
