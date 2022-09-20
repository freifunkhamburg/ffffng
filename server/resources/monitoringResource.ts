import CONSTRAINTS from "../shared/validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as MonitoringService from "../services/monitoringService";
import * as Resources from "../utils/resources";
import { handleJSONWithData } from "../utils/resources";
import { normalizeString } from "../shared/utils/strings";
import { forConstraint } from "../shared/validation/validator";
import type { Request, Response } from "express";
import {
    isMonitoringToken,
    JSONObject,
    MonitoringResponse,
    MonitoringToken,
    NodeMonitoringStateResponse,
    toMonitoringResponse,
} from "../types";
import { HttpHeader } from "../shared/utils/http";

const isValidToken = forConstraint(CONSTRAINTS.token, false);

async function doGetAll(
    req: Request
): Promise<{ total: number; result: NodeMonitoringStateResponse[] }> {
    const restParams = await Resources.getValidRestParams("list", null, req);
    const { monitoringStates, total } = await MonitoringService.getAll(
        restParams
    );
    return {
        total,
        result: monitoringStates,
    };
}

export function getAll(req: Request, res: Response): void {
    doGetAll(req)
        .then(({ total, result }) => {
            res.set(HttpHeader.X_TOTAL_COUNT, total.toString(10));
            Resources.success(res, result);
        })
        .catch((err) => Resources.error(res, err));
}

function getValidatedToken(data: JSONObject): MonitoringToken {
    if (!isMonitoringToken(data.token)) {
        throw { data: "Missing token.", type: ErrorTypes.badRequest };
    }
    const token = normalizeString(data.token);
    if (!isValidToken(token)) {
        throw { data: "Invalid token.", type: ErrorTypes.badRequest };
    }
    return token as MonitoringToken;
}

export const confirm = handleJSONWithData<MonitoringResponse>(async (data) => {
    const validatedToken = getValidatedToken(data);

    const node = await MonitoringService.confirm(validatedToken);
    return toMonitoringResponse(node);
});

export const disable = handleJSONWithData<MonitoringResponse>(async (data) => {
    const validatedToken: MonitoringToken = getValidatedToken(data);

    const node = await MonitoringService.disable(validatedToken);
    return toMonitoringResponse(node);
});
