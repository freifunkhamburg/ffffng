import _ from "lodash";

import CONSTRAINTS from "../validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as MonitoringService from "../services/monitoringService";
import * as Resources from "../utils/resources";
import {normalizeString} from "../utils/strings";
import {forConstraint} from "../validation/validator";
import {Request, Response} from "express";

const isValidToken = forConstraint(CONSTRAINTS.token, false);

async function doGetAll(req: Request): Promise<{total: number, result: any}> {
    const restParams = await Resources.getValidRestParams('list', null, req);
    const {monitoringStates, total} = await MonitoringService.getAll(restParams);
    return {
        total,
        result: _.map(monitoringStates, function (state) {
            state.mapId = _.toLower(state.mac).replace(/:/g, '');
            return state;
        })
    };
}

export function getAll(req: Request, res: Response): void {
    doGetAll(req)
        .then(({total, result}) => {
            res.set('X-Total-Count', total.toString(10));
            Resources.success(res, result)
        })
        .catch(err => Resources.error(res, err));
}

export function confirm(req: Request, res: Response): void {
    const data = Resources.getData(req);

    const token = normalizeString(data.token);
    if (!isValidToken(token)) {
        return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
    }

    MonitoringService.confirm(token)
        .then(node => Resources.success(res, {
            hostname: node.hostname,
            mac: node.mac,
            email: node.email,
            monitoring: node.monitoring,
            monitoringConfirmed: node.monitoringConfirmed
        }))
        .catch(err => Resources.error(res, err));
}

export function disable(req: Request, res: Response): void {
    const data = Resources.getData(req);

    const token = normalizeString(data.token);
    if (!isValidToken(token)) {
        return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
    }

    MonitoringService.disable(token)
        .then(node => Resources.success(res, {
            hostname: node.hostname,
            mac: node.mac,
            email: node.email,
            monitoring: node.monitoring
        }))
        .catch(err => Resources.error(res, err));
}
