export interface IDeviceStates {
    [key: string]: IDeviceState;
}

export interface IDeviceState {
    deviceID: string;
    status: 'active' | 'inactive';
    OK: boolean;
    desiredValveState: {
        A: boolean;
        B: boolean;
        C: boolean;
        D: boolean;
        E: boolean;
        F: boolean;
    };
    activeValves: {
        A: boolean;
        B: boolean;
        C: boolean;
        D: boolean;
        E: boolean;
        F: boolean;
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
            C: false,
            D: false,
            E: false,
            F: false
        },
        activeValves: {
            A: true,
            B: true,
            C: false,
            D: false,
            E: false,
            F: false
        }
    },
    "2": {
        deviceID: "2",
        status: "inactive",
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: false,
            D: false,
            E: false,
            F: false
        },
        activeValves: {
            A: false,
            B: false,
            C: false,
            D: false,
            E: false,
            F: false
        }
    },
    "3": {
        deviceID: "3",
        status: "active",
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: false,
            D: false,
            E: false,
            F: false
        },
        activeValves: {
            A: true,
            B: true,
            C: false,
            D: false,
            E: false,
            F: false
        }
    },
    "4": {
        deviceID: "4",
        status: "active",
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: false,
            D: false,
            E: false,
            F: false
        },
        activeValves: {
            A: true,
            B: true,
            C: false,
            D: false,
            E: false,
            F: false
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
            D: false,
            E: false,
            F: false
        },
        activeValves: {
            A: true,
            B: true,
            C: true,
            D: false,
            E: false,
            F: false
        }
    }
};