// SERIALS
export interface ISerialOptions {
    portId: string;
    baudRate: number;
    parity: string;
}

export interface ISerial {
    open(callback: (error: any) => void): void;
    write(data: string, callback?: (error: any) => void): void;
    close(callback: (error: any) => void): void;
    on(event: string, callback?: (data: any) => void): void;
}


// SCHEDULE
export type ISchedule = IDay[];

export interface IDay {
    name: string;
    schedule: Record<string, IScheduleHour>;
}

export interface IScheduleHour {
    default: string[];
    overrides: string[];
}


// ZONES
export type IZones = Record<string, IZone>;

export interface IZone {
    name: string;
    type: string;
    deviceID: number;
    valve: string;
}


// DEVICES
export interface IDeviceStates {
    [key: string]: IDeviceState;
}

export interface IDeviceState {
    deviceID: string;
    OK: boolean;
    desiredValveState: {
        A: boolean;
        B: boolean;
    };
}