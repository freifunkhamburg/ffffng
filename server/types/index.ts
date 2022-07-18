import {Domain, EmailAddress, JSONObject, MonitoringToken, OnlineState, Site, toIsEnum} from "./shared";

export * from "./config";
export * from "./logger";
export * from "./shared";

export type NodeStateData = {
    site: Site,
    domain: Domain,
    state: OnlineState,
}

// TODO: Complete interface / class declaration.
export type NodeSecrets = {
    monitoringToken?: MonitoringToken,
};

export type MailId = number & { readonly __tag: unique symbol };
export type MailData = JSONObject;

export enum MailType {
    MONITORING_OFFLINE_1 = "monitoring-offline-1",
    MONITORING_OFFLINE_2 = "monitoring-offline-2",
    MONITORING_OFFLINE_3 = "monitoring-offline-3",
    MONITORING_ONLINE_AGAIN = "monitoring-online-again",
    MONITORING_CONFIRMATION = "monitoring-confirmation",
}

export const isMailType = toIsEnum(MailType);

export interface Mail {
    id: MailId,
    email: MailType,
    sender: EmailAddress,
    recipient: EmailAddress,
    data: MailData,
    failures: number,
}

