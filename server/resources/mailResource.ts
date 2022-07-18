import CONSTRAINTS from "../validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as MailService from "../services/mailService";
import * as Resources from "../utils/resources";
import {normalizeString, parseInteger} from "../utils/strings";
import {forConstraint} from "../validation/validator";
import {Request, Response} from "express";
import {Mail, MailId} from "../types";

const isValidId = forConstraint(CONSTRAINTS.id, false);

async function withValidMailId(req: Request): Promise<MailId> {
    const id = normalizeString(Resources.getData(req).id);

    if (!isValidId(id)) {
        throw {data: 'Invalid mail id.', type: ErrorTypes.badRequest};
    }

    return parseInteger(id) as MailId;
}

async function doGet(req: Request): Promise<Mail> {
    const id = await withValidMailId(req);
    return await MailService.getMail(id);
}

export function get(req: Request, res: Response): void {
    doGet(req)
        .then(mail => Resources.success(res, mail))
        .catch(err => Resources.error(res, err))
}

async function doGetAll(req: Request): Promise<{total: number, mails: Mail[]}> {
    const restParams = await Resources.getValidRestParams('list', null, req);
    return await MailService.getPendingMails(restParams);
}

export function getAll (req: Request, res: Response): void {
    doGetAll(req)
        .then(({total, mails}) => {
            res.set('X-Total-Count', total.toString(10));
            return Resources.success(res, mails);
        })
        .catch(err => Resources.error(res, err))
}

async function doRemove(req: Request): Promise<void> {
    const id = await withValidMailId(req);
    await MailService.deleteMail(id);
}

export function remove (req: Request, res: Response): void {
    doRemove(req)
        .then(() => Resources.success(res, {}))
        .catch(err => Resources.error(res, err));
}

async function doResetFailures(req: Request): Promise<Mail> {
    const id = await withValidMailId(req);
    return await MailService.resetFailures(id);
}

export function resetFailures (req: Request, res: Response): void {
    doResetFailures(req)
        .then(mail => Resources.success(res, mail))
        .catch(err => Resources.error(res, err));
}
