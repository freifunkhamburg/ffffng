import _ from "lodash";

import CONSTRAINTS from "../validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as MonitoringService from "../services/monitoringService";
import * as Resources from "../utils/resources";
import {handleJSONWithData} from "../utils/resources";
import {normalizeString} from "../utils/strings";
import {forConstraint} from "../validation/validator";
import {Request, Response} from "express";
import {MonitoringResponse, MonitoringToken, toMonitoringResponse} from "../types";

const isValidToken = forConstraint(CONSTRAINTS.token, false);

async function doGetAll(req: Request): Promise<{ total: number, result: any }> {
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

export const confirm = handleJSONWithData<MonitoringResponse>(async data => {
    const token = normalizeString(data.token);
    if (!isValidToken(token)) {
        throw {data: 'Invalid token.', type: ErrorTypes.badRequest};
    }
    const validatedToken: MonitoringToken = token as MonitoringToken;

    const node = await MonitoringService.confirm(validatedToken);
    return toMonitoringResponse(node);
});

export const disable = handleJSONWithData<MonitoringResponse>(async data => {
    const token = normalizeString(data.token);
    if (!isValidToken(token)) {
        throw {data: 'Invalid token.', type: ErrorTypes.badRequest};
    }
    const validatedToken: MonitoringToken = token as MonitoringToken;

    const node = await MonitoringService.disable(validatedToken);
    return toMonitoringResponse(node);
});
