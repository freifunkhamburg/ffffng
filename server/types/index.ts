export * from "./config";
export * from "./logger";
export * from "./shared";

// TODO: Token type.
export type Token = string;
export type FastdKey = string;
export type MAC = string;

export type UnixTimestampSeconds = number;
export type UnixTimestampMilliseconds = number;

export type MonitoringToken = string;
export enum MonitoringState {
    ACTIVE = "active",
    PENDING = "pending",
    DISABLED = "disabled",
}

export type NodeId = string;

export enum NodeState {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE",
}

export type NodeStateData = {
    site: string,
    domain: string,
    state: NodeState,
}

export type Node = {
    token: Token;
    nickname: string;
    email: string;
    hostname: string;
    coords?: string; // TODO: Use object with longitude and latitude.
    key?: FastdKey;
    mac: MAC;
    monitoring: boolean;
    monitoringConfirmed: boolean;
    monitoringState: MonitoringState;
    modifiedAt: UnixTimestampSeconds;
};

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

