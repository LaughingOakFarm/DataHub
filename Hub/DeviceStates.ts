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

export const deviceStates: IDeviceStates = {
    "1": {
        deviceID: "1",
        OK: false,
        desiredValveState: {
            A: false,
            B: false
        }
    },
    "2": {
        deviceID: "2",
        OK: false,
        desiredValveState: {
            A: false,
            B: false
        }
    },
    "3": {
        deviceID: "3",
        OK: false,
        desiredValveState: {
            A: false,
            B: false
        }
    },
    "4": {
        deviceID: "4",
        OK: false,
        desiredValveState: {
            A: false,
            B: false
        }
    },
    "5": {
        deviceID: "5",
        OK: false,
        desiredValveState: {
            A: false,
            B: false
        }
    },
    "6": {
        deviceID: "6",
        OK: false,
        desiredValveState: {
            A: false,
            B: false
        }
    },
};