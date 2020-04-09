import ErrorTypes from "../utils/errorTypes";
import Logger from "../logger";
import {getNodeStatistics} from "../services/nodeService";
import * as Resources from "../utils/resources";
import {Request, Response} from "express";

export function get (req: Request, res: Response): void {
    // TODO: Promises and types.
    getNodeStatistics()
        .then(nodeStatistics => Resources.success(
            res,
            {
                nodes: nodeStatistics
            }
        ))
        .catch(err => {
            Logger.tag('statistics').error('Error getting statistics:', err);
            return Resources.error(res, {data: 'Internal error.', type: ErrorTypes.internalError});
        });
}
