import raspi from 'raspi';
import express from 'express';

interface ISerialOptions {
    portId: string;
    baudRate: number;
    parity: string;
}

interface ISerial {
    open(callback: (error: any) => void): void;
    write(data: string, callback?: (error: any) => void): void;
    close(callback: (error: any) => void): void;
    on(event: string, callback?: (data: any) => void): void;
}


type ISchedules = IDay[];

interface IDay {
    name: string;
    schedule: Record<string, IScheduleHour>;
}

interface IScheduleHour {
    default: string[];
    overrides: string[];
}

interface IZone {
    name: string;
    type: string;
    deviceID: number;
    valve: string;
}

interface IDeviceStates {
    [key: string]: IDeviceState;
}

interface IDeviceState {
    deviceID: string;
    OK: boolean;
    desiredValveState: {
        A: boolean;
        B: boolean;
    };
}

class MockSerial implements ISerial {
    constructor(private options: ISerialOptions) {
        console.log(`MockSerial initialized with portId ${options.portId} and baudRate ${options.baudRate}`);
    }

    open(callback: (error: any) => void): void {
        console.log("MockSerial port opened");
        callback(null);
    }

    write(data: string, callback: (error: any) => void): void {
        console.log(`MockSerial wrote: ${data}`);
        callback(null);
    }

    close(callback: (error: any) => void): void {
        console.log("MockSerial port closed");
        callback(null);
    }

    on(event: string, callback: (data: any) => void): void {
        console.log(`MockSerial event ${event} registered`);
    }
}

const app = express()
const port = 3000;
const deviceStates: IDeviceStates = {
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
    }
};

// The Plan
// 1. Every 10 seconds, send a request to the controller with the desired valve states
// 2. The controller will respond with DID=[Device ID]&OK=1
// 3. If the controller does not respond, then send the request again, up to 3 times
// 4. Go to the next device and repeat
// 5. If all devices have been sent, then wait 10 seconds and start over

raspi.init(() => {
    let stringData = "";

    let serial: ISerial;

    if (require('os').platform() === 'linux' && (require('os').arch() === 'arm' || require('os').arch() === 'arm64')) {
        // @ts-ignore
        serial = new Serial({
            portId: "/dev/ttyS0",
            baudRate: 9600,
            // @ts-ignore
            parity: Serial.PARITY_NONE
        });
    } else {
        serial = new MockSerial({
            portId: "/dev/ttyS0",
            baudRate: 9600,
            parity: "none"
        })
    }

    serial.open(() => {
        serial.on('data', (data) => {
            collectData(data);
        });
    });

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    });

    app.get('/', (req, res) => {
        res.send('hello world')
    });

    // send a request for each controller every 10 seconds
    // get the valve states from the schedule
    setInterval(async () => {
        const controllerDeviceIds = Object.keys(deviceStates);
        for (let i = 0; i < controllerDeviceIds.length; i++) {
            const deviceID = controllerDeviceIds[i];
            const deviceState = deviceStates[deviceID];
            deviceState.desiredValveState = { A: false, B: false };
            deviceState.OK = false;

            const valveState = getScheduleCommand(deviceID);
            if (valveState) {
                deviceState.desiredValveState[valveState] = true;
            }

            // try 1 times to get a response
            for (let j = 0; j < 1; j++) {
                sendMessage(
                    `|${deviceID}${deviceState.desiredValveState.A ? 1 : 0
                    }${deviceState.desiredValveState.B ? 1 : 0}|`
                );

                await sleep(2000);

                if (deviceState.OK) {
                    console.log("Device " + deviceID + " OK");
                    break;
                }

                await sleep(2000);
                console.log("Device " + deviceID + " not OK.");
            }

            await sleep(2000);
        }

        console.log("---------");
    }, 40000);

    function sendMessage(message: string) {
        console.log("Sending: ", message);
        serial.write(message);
    }

    async function collectData(byteArray: number[]) {
        const byteString = String.fromCharCode(...byteArray);
        stringData += byteString;

        if (stringData.includes('|')) {
            const commandArray = stringData.split('|');
            const newCommand = commandArray.shift() || "";

            //   console.log("Full Data: ", newCommand);
            const commandObject = parseControllerData(newCommand);

            if (commandObject) {
                if (commandObject.OK === '1' && commandObject.DID) {
                    deviceStates[commandObject.DID].OK = true;
                }
            }

            stringData = commandArray.join('|');
        }
    }
});

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getScheduleCommand(deviceID: string): "A" | "B" | "" {
    return "";
    // const date = new Date();
    // const adjustedDay = (date.getDay() - 1 + 7) % 7;
    // const hour = date.getHours();
    // // add a leading zero to the hour if needed
    // const time = `${hour < 10 ? '0' : ''}${hour}:00`;
    // const daySchedule = schedule.days[adjustedDay];

    // const scheduleCommand = daySchedule.schedule[time as string];
    // if (!scheduleCommand) {
    //     return false;
    // }

    // const commandDeviceID = scheduleCommand[0];
    // const valveLetter = scheduleCommand[1];

    // if (deviceID != commandDeviceID) {
    //     return false;
    // }

    // return valveLetter;
}

// function getScheduleCommandTest(deviceID: string) {
//     const date = new Date();
//     const adjustedDay = (date.getDay() - 1 + 7) % 7;
//     const hour = date.getHours();

//     // add a leading zero to the hour if needed
//     const time = `${hour < 10 ? '0' : ''}${hour}:00`;
//     const daySchedule = schedule.days[adjustedDay];
//     const minute = date.getMinutes();
//     console.log("Minute: ", minute);

//     // every other 7 seconds turn on a different valve

//     // if the deviceID is 1, then turn on valve for every other 7 minutes
//     if (deviceID === "1" && [0, 7, 14, 21, 28, 35, 42, 49, 56].includes(minute)) {
//         return 'A';
//     } else if (deviceID == "1" && [1, 8, 15, 22, 29, 36, 43, 50, 57].includes(minute)) {
//         return 'B';
//     } else if (deviceID == "2" && [2, 9, 16, 23, 30, 37, 44, 51, 58].includes(minute)) {
//         return 'A';
//     } else if (deviceID == "2" && [3, 10, 17, 24, 31, 38, 45, 52, 59].includes(minute)) {
//         return 'B';
//     } else if (deviceID == "3" && [5, 12, 19, 26, 33, 40, 47, 54].includes(minute)) {
//         return 'B';
//     } else if (deviceID == "4" && [6, 13, 20, 27, 34, 41, 48, 55].includes(minute)) {
//         return 'A';
//     }

//     return false;
// }

// Data format: DID=1&TID=-14282&H=50.00&T=69.98&A=1&B=1
function parseControllerData(data: string) {
    const dataObject: any = {};
    const dataArray = data.split('&');
    dataArray.forEach((item) => {
        const itemArray = item.split('=');
        dataObject[itemArray[0]] = itemArray[1];
    });

    return dataObject;
}

// Add an event listener for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Unhandled exception:', error);

    // Exit the process with an error code
    process.exit(1);
});

const zones: Record<string, IZone> = {
    "1A": {
        name: "Girls Zone (5)",
        type: "pasture",
        deviceID: 1,
        valve: "A",
    },
    "1B": {
        name: "Pond Zone (3)",
        type: "pasture",
        deviceID: 1,
        valve: "B",
    },
    "2A": {
        name: "Oak Zone (4)",
        type: "pasture",
        deviceID: 2,
        valve: "A",
    },
    "2B": {
        name: "Boys Zone (3)",
        type: "pasture",
        deviceID: 2,
        valve: "B",
    },
    "3A": {
        name: "Pond Fill (1)",
        type: "pond",
        deviceID: 3,
        valve: "A",
    },
    "3B": {
        name: "Pond Path (2)",
        type: "lawn",
        deviceID: 3,
        valve: "B",
    },
    "4A": {
        name: "Lawn (5)",
        type: "lawn",
        deviceID: 4,
        valve: "A",
    }
};

const schedule: ISchedules = [
    {
        name: "Monday",
        schedule: {}
    },
    {
        name: "Tuesday",
        schedule: {}

    },
    {
        name: "Wednesday",
        schedule: {}
    },
    {
        name: "Thursday",
        schedule: {}
    },
    {
        name: "Friday",
        schedule: {}
    },
    {
        name: "Saturday",
        schedule: {}
    },
    {
        name: "Sunday",
        schedule: {}
    }
];

