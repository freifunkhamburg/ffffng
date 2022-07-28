import CONSTRAINTS from "../validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as MonitoringService from "../services/monitoringService";
import * as Resources from "../utils/resources";
import {handleJSONWithData} from "../utils/resources";
import {normalizeString} from "../utils/strings";
import {forConstraint} from "../validation/validator";
import {Request, Response} from "express";
import {isMonitoringToken, JSONObject, MonitoringResponse, MonitoringToken, toMonitoringResponse} from "../types";

const isValidToken = forConstraint(CONSTRAINTS.token, false);

async function doGetAll(req: Request): Promise<{ total: number, result: any }> {
    const restParams = await Resources.getValidRestParams('list', null, req);
    const {monitoringStates, total} = await MonitoringService.getAll(restParams);
    return {
        total,
        result: monitoringStates.map(state => {
            state.mapId = state.mac.toLowerCase().replace(/:/g, "");
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

function getValidatedToken(data: JSONObject): MonitoringToken {
    if (!isMonitoringToken(data.token)) {
        throw {data: 'Missing token.', type: ErrorTypes.badRequest};
    }
    const token = normalizeString(data.token);
    if (!isValidToken(token)) {
        throw {data: 'Invalid token.', type: ErrorTypes.badRequest};
    }
    return token as MonitoringToken;
}

export const confirm = handleJSONWithData<MonitoringResponse>(async data => {
    const validatedToken = getValidatedToken(data);

    const node = await MonitoringService.confirm(validatedToken);
    return toMonitoringResponse(node);
});

export const disable = handleJSONWithData<MonitoringResponse>(async data => {
    const validatedToken: MonitoringToken = getValidatedToken(data);

    const node = await MonitoringService.disable(validatedToken);
    return toMonitoringResponse(node);
});
