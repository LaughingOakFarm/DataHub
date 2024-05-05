export type ISendQueue = ISendQueueItem[];

export interface ISendQueueItem {
    deviceID: string;
    command: string;
}

export const sendQueue: ISendQueue = [];