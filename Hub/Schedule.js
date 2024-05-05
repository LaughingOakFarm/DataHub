"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const raspi = __importStar(require("raspi"));
const express_1 = __importDefault(require("express"));
const DeviceStates_1 = require("./DeviceStates");
const MockSerial_1 = require("./MockSerial");
const fs_1 = __importDefault(require("fs"));
const EmptySchedule_1 = require("./EmptySchedule");
const Zones_1 = require("./Zones");
const cors_1 = __importDefault(require("cors"));
const SendQueue_1 = require("./SendQueue");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: '*'
}));
const port = 3000;
if (!fs_1.default.existsSync("schedule.json")) {
    saveScheduleFile(EmptySchedule_1.emptySchedule);
}
const currentScheduleRaw = fs_1.default.readFileSync("schedule.json", "utf8");
let currentSchedule = JSON.parse(currentScheduleRaw) || EmptySchedule_1.emptySchedule;
raspi.init(() => {
    let stringData = "";
    let serial;
    if (require('os').platform() === 'linux' && (require('os').arch() === 'arm' || require('os').arch() === 'arm64')) {
        const Serial = require('raspi-serial').Serial;
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
        console.log(`Listening on port ${port}`);
    });
    app.get('/', (req, res) => {
        res.send('OK');
    });
    app.get('/deviceStates', (req, res) => {
        res.send(DeviceStates_1.deviceStates);
    });
    app.get('/zones', (req, res) => {
        res.send(Zones_1.zones);
    });
    app.get('/schedule', (req, res) => {
        res.send(currentSchedule);
    });
    app.get('/sendQueue', (req, res) => {
        res.send(SendQueue_1.sendQueue);
    });
    app.get('/init', (req, res) => {
        res.send({
            zones: Zones_1.zones,
            deviceStates: DeviceStates_1.deviceStates,
            schedule: currentSchedule,
            sendQueue: SendQueue_1.sendQueue
        });
    });
    app.get('/create-empty-schedule', (req, res) => {
        saveScheduleFile(EmptySchedule_1.emptySchedule);
        res.send(EmptySchedule_1.emptySchedule);
    });
    app.get('/set-schedule', (req, res) => {
        // query params: 
        // day: string, ex: "0" for Monday
        // time: string, ex: "12" for noon
        // zone: string, ex: "A1"
        // isDefault: boolean, ex: true
        const day = parseInt(req.query.day, 10);
        const time = parseInt(req.query.time, 10);
        const zone = req.query.zone;
        const isDefault = req.query.isDefault === "true";
        if (day > 6 || day < 0) {
            res.json({ error: "Day is required and must be between 0 and 6" });
            return;
        }
        if (time > 23 || time < 0) {
            res.json({ error: "Time is required and must be between 0 and 23" });
            return;
        }
        const schedule = currentSchedule;
        const daySchedule = schedule[day.toString()];
        const hourSchedule = daySchedule.schedule[time.toString()];
        if (isDefault) {
            hourSchedule.default = [zone];
        }
        else {
            hourSchedule.overrides = [zone];
        }
        saveScheduleFile(schedule);
        res.send(schedule);
    });
    app.get('/clear-overrides', (req, res) => {
        removeExpiredOverrides();
        res.send(currentSchedule);
    });
    // send a request for each controller every 10 seconds
    // get the valve states from the schedule
    // setInterval(async () => {
    //     const controllerDeviceIds = Object.keys(deviceStates);
    //     for (let i = 0; i < controllerDeviceIds.length; i++) {
    //         const deviceID = controllerDeviceIds[i];
    //         const deviceState = deviceStates[deviceID];
    //         deviceState.desiredValveState = { A: false, B: false };
    //         deviceState.OK = false;
    //         const valveState = getScheduleCommand(deviceID);
    //         if (valveState) {
    //             deviceState.desiredValveState[valveState] = true;
    //         }
    //         // try 1 times to get a response
    //         for (let j = 0; j < 1; j++) {
    //             sendMessage(
    //                 `|${deviceID}${deviceState.desiredValveState.A ? 1 : 0
    //                 }${deviceState.desiredValveState.B ? 1 : 0}|`
    //             );
    //             await sleep(2000);
    //             if (deviceState.OK) {
    //                 console.log("Device " + deviceID + " OK");
    //                 break;
    //             }
    //             await sleep(2000);
    //             console.log("Device " + deviceID + " not OK.");
    //         }
    //         await sleep(2000);
    //     }
    //     console.log("---------");
    // }, 30000);
    function fillQueue() {
        const controllerDeviceIds = Object.keys(DeviceStates_1.deviceStates);
        console.log("Filling queue");
        console.log("-------------");
        for (let i = 0; i < controllerDeviceIds.length; i++) {
            const deviceID = controllerDeviceIds[i];
            const deviceState = DeviceStates_1.deviceStates[deviceID];
            deviceState.desiredValveState = { A: false, B: false };
            deviceState.OK = false;
            const valveState = getScheduleCommand(deviceID);
            if (valveState) {
                deviceState.desiredValveState[valveState] = true;
            }
            const command = `|${deviceID}${deviceState.desiredValveState.A ? 1 : 0}${deviceState.desiredValveState.B ? 1 : 0}|`;
            SendQueue_1.sendQueue.push({
                deviceID,
                command
            });
        }
    }
    fillQueue(); // fill the queue on startup
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        fillQueue();
    }), 30000); // fill the queue every 30 seconds
    // setInterval(async () => {
    //     if (sendQueue.length > 0) {
    //         const sendItem = sendQueue.shift();
    //         if (!sendItem) {
    //             return;
    //         }
    //         console.log("Sending: ", sendItem.command);
    //         sendMessage(sendItem.command);
    //         await sleep(2000);
    //         const deviceState = deviceStates[sendItem.deviceID];
    //         if (deviceState.OK) {
    //             console.log("Device " + sendItem.deviceID + " OK");
    //             return;
    //         }
    //         console.log("Device " + sendItem.deviceID + " not OK.");
    //     }
    // }, 5000);
    let isProcessing = false;
    function checkDeviceState(deviceID) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                resolve(false); // Resolve as false after 2 seconds
            }, 2000);
            const checkState = () => {
                const deviceState = DeviceStates_1.deviceStates[deviceID];
                if (deviceState.OK) {
                    clearTimeout(timeout);
                    process.stdout.write(`OK\n`);
                    resolve(true);
                }
                else {
                    setTimeout(checkState, 100); // Check every 100 ms
                }
            };
            checkState();
        });
    }
    function processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (isProcessing || SendQueue_1.sendQueue.length === 0)
                return;
            isProcessing = true;
            const sendItem = SendQueue_1.sendQueue.shift();
            if (!sendItem) {
                isProcessing = false;
                return;
            }
            sendMessage(sendItem.command);
            const isOk = yield checkDeviceState(sendItem.deviceID);
            isProcessing = false;
            if (isOk) {
                processQueue();
            }
            else {
                process.stdout.write(`NOT OK\n`);
            }
        });
    }
    // Start processing queue
    setInterval(processQueue, 5000); // This continues to check if it should process the queue
    function sendMessage(message) {
        process.stdout.write(`Sending: ${message} ... `);
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
function saveScheduleFile(schedule) {
    currentSchedule = schedule;
    fs_1.default.writeFile("schedule.json", JSON.stringify(schedule), (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
    console.log("Schedule saved");
}
function removeExpiredOverrides() {
    const date = new Date();
    for (let i = 0; i < 7; i++) {
        const daySchedule = currentSchedule[i.toString()];
        for (let j = 0; j < 24; j++) {
            const hourSchedule = daySchedule.schedule[j.toString()];
            hourSchedule.overrides = [];
        }
    }
    saveScheduleFile(currentSchedule);
}
function getScheduleCommand(deviceID) {
    const date = new Date();
    const adjustedDay = (date.getDay() - 1 + 7) % 7;
    const hour = date.getHours();
    const daySchedule = currentSchedule[adjustedDay];
    const scheduleCommand = daySchedule.schedule[hour];
    const currentCommand = scheduleCommand.overrides[0] || scheduleCommand.default[0];
    if (!currentCommand) {
        return "";
    }
    const commandDeviceID = currentCommand[0];
    const valveLetter = currentCommand[1];
    if (deviceID != commandDeviceID) {
        return "";
    }
    return valveLetter;
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
