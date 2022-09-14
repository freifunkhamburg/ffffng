/**
 * Contains types and type guards around emails.
 */
import { toIsNewtype } from "./newtypes";
import { isNumber, isString } from "./primitives";
import type { JSONObject } from "./json";
import { toIsEnum } from "./enums";
import { type SortFieldFor, toIsSortField } from "./sortfields";
import type { UnixTimestampSeconds } from "./time";

/**
 * An email address.
 */
export type EmailAddress = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link EmailAddress}.
 *
 * @param arg - Value to check.
 */
export const isEmailAddress = toIsNewtype(isString, "" as EmailAddress);

/**
 * ID of an email in the mail queue waiting to be sent.
 */
export type MailId = number & { readonly __tag: unique symbol };

/**
 * Type guard for {@link MailId}.
 *
 * @param arg - Value to check.
 */
export const isMailId = toIsNewtype(isNumber, NaN as MailId);

/**
 * Data of an email in the mail queue waiting to be sent.
 */
export type Mail = {
    /**
     * ID of the email in the queue.
     */
    id: MailId;

    /**
     * Type of the to be sent email.
     *
     * See {@link MailType}.
     */
    email: MailType;

    /**
     * Sender address of the email.
     */
    sender: EmailAddress;

    /**
     * Recipient address of the email.
     */
    recipient: EmailAddress;

    /**
     * Data to be rendered into the email template. This is specific to the email's {@link MailType}.
     */
    data: MailData;

    /**
     * Number of times trying to send the queued email has failed.
     */
    failures: number;

    /**
     * Time the email has been queued first.
     */
    created_at: UnixTimestampSeconds;

    /**
     * Last time the email has been modified inside the queue.
     */
    modified_at: UnixTimestampSeconds;
};

/**
 * Type of the email being sent. This determines which email template is being used and in which format the
 * {@link MailData} is being expected.
 */
export enum MailType {
    /**
     * First monitoring email sent when a Freifunk node is offline.
     */
    MONITORING_OFFLINE_1 = "monitoring-offline-1",

    /**
     * Second monitoring (first reminder) email sent when a Freifunk node is offline.
     */
    MONITORING_OFFLINE_2 = "monitoring-offline-2",

    /**
     * Third monitoring (second and last reminder) email sent when a Freifunk node is offline.
     */
    MONITORING_OFFLINE_3 = "monitoring-offline-3",

    /**
     * Email notifying the owner that their Freifunk node is back online.
     */
    MONITORING_ONLINE_AGAIN = "monitoring-online-again",

    /**
     * Email holding a confirmation link to enable monitoring for a Freifunk node (double opt-in).
     */
    MONITORING_CONFIRMATION = "monitoring-confirmation",
}

/**
 * Type guard for {@link MailType}.
 *
 * @param arg - Value to check.
 */
export const isMailType = toIsEnum(MailType);

/**
 * Type of data being rendered into an email template. This is specific to the email's {@link MailType}.
 */
export type MailData = JSONObject;

/**
 * Enum specifying the allowed sort fields when retrieving the list of emails in the mail queue via
 * the REST API.
 */
export enum MailSortFieldEnum {
    // noinspection JSUnusedGlobalSymbols

    /**
     * See {@link Mail.id}.
     */
    ID = "id",

    /**
     * See {@link Mail.failures}.
     */
    FAILURES = "failures",

    /**
     * See {@link Mail.sender}.
     */
    SENDER = "sender",

    /**
     * See {@link Mail.recipient}.
     */
    RECIPIENT = "recipient",

    /**
     * See {@link Mail.email}.
     */
    EMAIL = "email",

    /**
     * See {@link Mail.created_at}.
     */
    CREATED_AT = "created_at",

    /**
     See {@link Mail.modified_at}.
     */
    MODIFIED_AT = "modified_at",
}

/**
 * Allowed sort fields when retrieving the list of emails in the mail queue via the REST API.
 */
export type MailSortField = SortFieldFor<Mail, MailSortFieldEnum>;

/**
 * Type guard for {@link MailSortField}.
 *
 * @param arg - Value to check.
 */
export const isMailSortField = toIsSortField<
    Mail,
    MailSortFieldEnum,
    typeof MailSortFieldEnum,
    MailSortField
>(MailSortFieldEnum);
