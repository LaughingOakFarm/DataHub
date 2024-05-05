export type IRecentSends = ISend[];

export interface ISend {
    deviceID: string;
    request: {
        command: string;
        ts: Date;
    }
    response: {
        command: string;
        ts: Date;
    }
}

export const recentSends: IRecentSends = [];