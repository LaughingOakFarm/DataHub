"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const raspi_1 = __importDefault(require("raspi"));
const express_1 = __importDefault(require("express"));
const DeviceStates_1 = require("./DeviceStates");
const MockSerial_1 = require("./MockSerial");
const app = (0, express_1.default)();
const port = 3000;
raspi_1.default.init(() => {
    let stringData = "";
    let serial;
    if (require('os').platform() === 'linux' && (require('os').arch() === 'arm' || require('os').arch() === 'arm64')) {
        // @ts-ignore
        serial = new Serial({
            portId: "/dev/ttyS0",
            baudRate: 9600,
            // @ts-ignore
            parity: Serial.PARITY_NONE
        });
    }
    else {
        serial = new MockSerial_1.MockSerial({
            portId: "/dev/ttyS0",
            baudRate: 9600,
            parity: "none"
        });
    }
    serial.open(() => {
        serial.on('data', (data) => {
            collectData(data);
        });
    });
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
    app.get('/', (req, res) => {
        res.send('hello world');
    });
    // send a request for each controller every 10 seconds
    // get the valve states from the schedule
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        const controllerDeviceIds = Object.keys(DeviceStates_1.deviceStates);
        for (let i = 0; i < controllerDeviceIds.length; i++) {
            const deviceID = controllerDeviceIds[i];
            const deviceState = DeviceStates_1.deviceStates[deviceID];
            deviceState.desiredValveState = { A: false, B: false };
            deviceState.OK = false;
            const valveState = getScheduleCommand(deviceID);
            if (valveState) {
                deviceState.desiredValveState[valveState] = true;
            }
            // try 1 times to get a response
            for (let j = 0; j < 1; j++) {
                sendMessage(`|${deviceID}${deviceState.desiredValveState.A ? 1 : 0}${deviceState.desiredValveState.B ? 1 : 0}|`);
                yield sleep(2000);
                if (deviceState.OK) {
                    console.log("Device " + deviceID + " OK");
                    break;
                }
                yield sleep(2000);
                console.log("Device " + deviceID + " not OK.");
            }
            yield sleep(2000);
        }
        console.log("---------");
    }), 40000);
    function sendMessage(message) {
        console.log("Sending: ", message);
        serial.write(message);
    }
    function collectData(byteArray) {
        return __awaiter(this, void 0, void 0, function* () {
            const byteString = String.fromCharCode(...byteArray);
            stringData += byteString;
            if (stringData.includes('|')) {
                const commandArray = stringData.split('|');
                const newCommand = commandArray.shift() || "";
                //   console.log("Full Data: ", newCommand);
                const commandObject = parseControllerData(newCommand);
                if (commandObject) {
                    if (commandObject.OK === '1' && commandObject.DID) {
                        DeviceStates_1.deviceStates[commandObject.DID].OK = true;
                    }
                }
                stringData = commandArray.join('|');
            }
        });
    }
});
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function getScheduleCommand(deviceID) {
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
function parseControllerData(data) {
    const dataObject = {};
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
