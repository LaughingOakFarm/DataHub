export interface IDeviceStates {
    [key: string]: IDeviceState;
}

export interface IDeviceState {
    deviceID: string;
    status: 'active' | 'inactive';
    OK: boolean;
    desiredValveState: {
        A: boolean | null;
        B: boolean | null;
        C: boolean | null;
        D: boolean | null;
        E: boolean | null;
        F: boolean | null;
    };
}

export const deviceStates: IDeviceStates = {
    "1": {
        deviceID: "1",
        status: "active",
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: null,
            D: null,
            E: null,
            F: null
        }
    },
    "2": {
        deviceID: "2",
        status: "active",
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: null,
            D: null,
            E: null,
            F: null
        }
    },
    "3": {
        deviceID: "3",
        status: "active",
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: null,
            D: null,
            E: null,
            F: null
        }
    },
    "4": {
        deviceID: "4",
        status: "active",
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: null,
            D: null,
            E: null,
            F: null
        }
    },
    "5": {
        deviceID: "5",
        status: "active",
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: false,
            D: null,
            E: null,
            F: null
        }
    }
};