import _ from "lodash";
import moment, { Moment } from "moment";
import { db } from "../db/database";
import Logger from "../logger";
import * as MailTemplateService from "./mailTemplateService";
import * as Resources from "../utils/resources";
import { RestParams } from "../utils/resources";
import {
    EmailAddress,
    isJSONObject,
    isMailSortField,
    isMailType,
    Mail,
    MailData,
    MailId,
    MailSortField,
    MailSortFieldEnum,
    MailType,
    UnixTimestampSeconds,
} from "../types";
import ErrorTypes from "../utils/errorTypes";
import { send } from "../mail";
import { parseJSON } from "../shared/utils/json";

type EmaiQueueRow = {
    id: MailId;
    created_at: UnixTimestampSeconds;
    data: string;
    email: string;
    failures: number;
    modified_at: UnixTimestampSeconds;
    recipient: EmailAddress;
    sender: EmailAddress;
};

const MAIL_QUEUE_DB_BATCH_SIZE = 50;

async function sendMail(options: Mail): Promise<void> {
    Logger.tag("mail", "queue").info(
        "Sending pending mail[%d] of type %s. " + "Had %d failures before.",
        options.id,
        options.email,
        options.failures
    );

    const renderedTemplate = await MailTemplateService.render(options);

    const mailOptions = {
        from: options.sender,
        to: options.recipient,
        subject: renderedTemplate.subject,
        html: renderedTemplate.body,
    };

    await send(mailOptions);

    Logger.tag("mail", "queue").info("Mail[%d] has been send.", options.id);
}

async function findPendingMailsBefore(
    beforeMoment: Moment,
    limit: number
): Promise<Mail[]> {
    const rows = await db.all<EmaiQueueRow>(
        "SELECT * FROM email_queue WHERE modified_at < ? AND failures < ? ORDER BY id ASC LIMIT ?",
        [beforeMoment.unix(), 5, limit]
    );

    return rows.map((row) => {
        const mailType = row.email;
        if (!isMailType(mailType)) {
            throw new Error(`Invalid mailtype in database: ${mailType}`);
        }
        const data = parseJSON(row.data);
        if (!isJSONObject(data)) {
            throw new Error(`Invalid email data in database: ${typeof data}`);
        }
        return {
            id: row.id,
            email: mailType,
            sender: row.sender,
            recipient: row.recipient,
            data,
            failures: row.failures,
            created_at: row.created_at,
            modified_at: row.modified_at,
        };
    });
}

async function removePendingMailFromQueue(id: MailId): Promise<void> {
    await db.run("DELETE FROM email_queue WHERE id = ?", [id]);
}

async function incrementFailureCounterForPendingEmail(
    id: MailId
): Promise<void> {
    await db.run(
        "UPDATE email_queue SET failures = failures + 1, modified_at = ? WHERE id = ?",
        [moment().unix(), id]
    );
}

async function sendPendingMail(pendingMail: Mail): Promise<void> {
    try {
        await sendMail(pendingMail);
    } catch (error) {
        // we only log the error and increment the failure counter as we want to continue with pending mails
        Logger.tag("mail", "queue").error(
            "Error sending pending mail[" + pendingMail.id + "]:",
            error
        );

        await incrementFailureCounterForPendingEmail(pendingMail.id);
        return;
    }

    await removePendingMailFromQueue(pendingMail.id);
}

async function doGetMail(id: MailId): Promise<Mail> {
    const row = await db.get<Mail>("SELECT * FROM email_queue WHERE id = ?", [
        id,
    ]);
    if (row === undefined) {
        throw { data: "Mail not found.", type: ErrorTypes.notFound };
    }
    return row;
}

export async function enqueue(
    sender: string,
    recipient: string,
    email: MailType,
    data: MailData
): Promise<void> {
    if (!_.isPlainObject(data)) {
        throw new Error("Unexpected data: " + data);
    }
    await db.run(
        "INSERT INTO email_queue " +
            "(failures, sender, recipient, email, data) " +
            "VALUES (?, ?, ?, ?, ?)",
        [0, sender, recipient, email, JSON.stringify(data)]
    );
}

export async function getMail(id: MailId): Promise<Mail> {
    return await doGetMail(id);
}

export async function getPendingMails(
    restParams: RestParams
): Promise<{ mails: Mail[]; total: number }> {
    const row = await db.get<{ total: number }>(
        "SELECT count(*) AS total FROM email_queue",
        []
    );

    const total = row?.total || 0;

    const filter = Resources.filterClause<MailSortField>(
        restParams,
        MailSortFieldEnum.ID,
        isMailSortField,
        ["id", "failures", "sender", "recipient", "email"]
    );

    const mails = await db.all<Mail>(
        "SELECT * FROM email_queue WHERE " + filter.query,
        filter.params
    );

    return {
        mails,
        total,
    };
}

export async function deleteMail(id: MailId): Promise<void> {
    await removePendingMailFromQueue(id);
}

export async function resetFailures(id: MailId): Promise<Mail> {
    const statement = await db.run(
        "UPDATE email_queue SET failures = 0, modified_at = ? WHERE id = ?",
        [moment().unix(), id]
    );

    if (!statement.changes) {
        throw new Error("Error: could not reset failure count for mail: " + id);
    }

    return await doGetMail(id);
}

export async function sendPendingMails(): Promise<void> {
    Logger.tag("mail", "queue").debug("Start sending pending mails...");

    const startTime = moment();

    let pendingMails = await findPendingMailsBefore(
        startTime,
        MAIL_QUEUE_DB_BATCH_SIZE
    );

    while (!_.isEmpty(pendingMails)) {
        Logger.tag("mail", "queue").debug("Sending next batch...");

        for (const pendingMail of pendingMails) {
            await sendPendingMail(pendingMail);
        }

        pendingMails = await findPendingMailsBefore(
            startTime,
            MAIL_QUEUE_DB_BATCH_SIZE
        );
    }

    Logger.tag("mail", "queue").debug("Done sending pending mails.");
}
