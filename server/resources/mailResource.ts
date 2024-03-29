import CONSTRAINTS from "../shared/validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as MailService from "../services/mailService";
import * as Resources from "../utils/resources";
import { handleJSONWithData, RequestData } from "../utils/resources";
import { normalizeString } from "../shared/utils/strings";
import { forConstraint } from "../shared/validation/validator";
import type { Request, Response } from "express";
import { isString, Mail, MailId } from "../types";
import { HttpHeader } from "../shared/utils/http";
import { parseToInteger } from "../shared/utils/numbers";

const isValidId = forConstraint(CONSTRAINTS.id, false);

async function withValidMailId(data: RequestData): Promise<MailId> {
    if (!isString(data.id)) {
        throw { data: "Missing mail id.", type: ErrorTypes.badRequest };
    }

    const id = normalizeString(data.id);

    if (!isValidId(id)) {
        throw { data: "Invalid mail id.", type: ErrorTypes.badRequest };
    }

    return parseToInteger(id) as MailId;
}

export const get = handleJSONWithData(async (data) => {
    const id = await withValidMailId(data);
    return await MailService.getMail(id);
});

async function doGetAll(
    req: Request
): Promise<{ total: number; mails: Mail[] }> {
    const restParams = await Resources.getValidRestParams("list", null, req);
    return await MailService.getPendingMails(restParams);
}

export function getAll(req: Request, res: Response): void {
    doGetAll(req)
        .then(({ total, mails }) => {
            res.set(HttpHeader.X_TOTAL_COUNT, total.toString(10));
            return Resources.success(res, mails);
        })
        .catch((err) => Resources.error(res, err));
}

export const remove = handleJSONWithData(async (data) => {
    const id = await withValidMailId(data);
    await MailService.deleteMail(id);
});

export const resetFailures = handleJSONWithData(async (data) => {
    const id = await withValidMailId(data);
    return await MailService.resetFailures(id);
});
