import {Domain, MonitoringToken, OnlineState, Site} from "./shared";

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

export type MailId = string;
export type MailData = any;
export type MailType = string;

export interface Mail {
    id: MailId,
    email: MailType,
    sender: string,
    recipient: string,
    data: MailData,
    failures: number,
}

