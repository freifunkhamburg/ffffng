import _ from "lodash";
import deepExtend from "deep-extend";
import moment, {Moment} from "moment";
import {createTransport, Transporter} from "nodemailer";

import {config} from "../config";
import {db} from "../db/database";
import Logger from "../logger";
import * as MailTemplateService from "./mailTemplateService";
import * as Resources from "../utils/resources";
import {RestParams} from "../utils/resources";
import {isMailSortField, Mail, MailData, MailId, MailSortField, MailType} from "../types";

const MAIL_QUEUE_DB_BATCH_SIZE = 50;

// TODO: Extract transporter into own module and initialize during main().
let transporterSingleton: Transporter | null = null;

function transporter() {
    if (!transporterSingleton) {
        transporterSingleton = createTransport(deepExtend(
            {},
            config.server.email.smtp,
            {
                transport: 'smtp',
                pool: true
            }
        ));

        MailTemplateService.configureTransporter(transporterSingleton);
    }

    return transporterSingleton;
}

async function sendMail(options: Mail): Promise<void> {
    Logger
        .tag('mail', 'queue')
        .info(
            'Sending pending mail[%d] of type %s. ' +
            'Had %d failures before.',
            options.id, options.email, options.failures
        );

    const renderedTemplate = await MailTemplateService.render(options);

    const mailOptions = {
        from: options.sender,
        to: options.recipient,
        subject: renderedTemplate.subject,
        html: renderedTemplate.body
    };

    await transporter().sendMail(mailOptions);

    Logger.tag('mail', 'queue').info('Mail[%d] has been send.', options.id);
}

async function findPendingMailsBefore(beforeMoment: Moment, limit: number): Promise<Mail[]> {
    const rows = await db.all(
        'SELECT * FROM email_queue WHERE modified_at < ? AND failures < ? ORDER BY id ASC LIMIT ?',
        [beforeMoment.unix(), 5, limit],
    );

    return _.map(rows, row => deepExtend(
        {},
        row,
        {
            data: JSON.parse(row.data)
        }
    ));
}

async function removePendingMailFromQueue(id: MailId): Promise<void> {
    await db.run('DELETE FROM email_queue WHERE id = ?', [id]);
}

async function incrementFailureCounterForPendingEmail(id: MailId): Promise<void> {
    const now = moment();
    await db.run(
        'UPDATE email_queue SET failures = failures + 1, modified_at = ? WHERE id = ?',
        [now.unix(), id],
    );
}

async function sendPendingMail(pendingMail: Mail): Promise<void> {
    try {
        await sendMail(pendingMail);
    }
    catch (error) {
        // we only log the error and increment the failure counter as we want to continue with pending mails
        Logger.tag('mail', 'queue').error('Error sending pending mail[' + pendingMail.id + ']:', error);

        await incrementFailureCounterForPendingEmail(pendingMail.id);
        return;
    }

    await removePendingMailFromQueue(pendingMail.id);
}

async function doGetMail(id: MailId): Promise<Mail> {
    return await db.get('SELECT * FROM email_queue WHERE id = ?', [id]);
}

export async function enqueue (sender: string, recipient: string, email: MailType, data: MailData): Promise<void> {
    if (!_.isPlainObject(data)) {
        throw new Error('Unexpected data: ' + data);
    }
    await db.run(
        'INSERT INTO email_queue ' +
        '(failures, sender, recipient, email, data) ' +
        'VALUES (?, ?, ?, ?, ?)',
        [0, sender, recipient, email, JSON.stringify(data)],
    );
}

export async function getMail (id: MailId): Promise<Mail> {
    return await doGetMail(id);
}

export async function getPendingMails (restParams: RestParams): Promise<{mails: Mail[], total: number}> {
    const row = await db.get(
        'SELECT count(*) AS total FROM email_queue',
        [],
    );

    const total = row.total;

    const filter = Resources.filterClause(
        restParams,
        MailSortField.ID,
        isMailSortField,
        ['id', 'failures', 'sender', 'recipient', 'email']
    );

    const mails = await db.all(
        'SELECT * FROM email_queue WHERE ' + filter.query,
        _.concat([], filter.params),
    );

    return {
        mails,
        total
    }
}

export async function deleteMail (id: MailId): Promise<void> {
    await removePendingMailFromQueue(id);
}

export async function resetFailures (id: MailId): Promise<Mail> {
    const statement = await db.run(
        'UPDATE email_queue SET failures = 0, modified_at = ? WHERE id = ?',
        [moment().unix(), id],
    );

    if (!statement.changes) {
        throw new Error('Error: could not reset failure count for mail: ' + id);
    }

    return await doGetMail(id);
}

export async function sendPendingMails (): Promise<void> {
    Logger.tag('mail', 'queue').debug('Start sending pending mails...');

    const startTime = moment();

    while (true) {
        Logger.tag('mail', 'queue').debug('Sending next batch...');

        const pendingMails = await findPendingMailsBefore(startTime, MAIL_QUEUE_DB_BATCH_SIZE);

        if (_.isEmpty(pendingMails)) {
            Logger.tag('mail', 'queue').debug('Done sending pending mails.');
            return;
        }

        for (const pendingMail of pendingMails) {
            await sendPendingMail(pendingMail);
        }
    }
}
