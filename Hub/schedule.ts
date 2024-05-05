// @ts-ignore
import * as raspi from "raspi";
import express from 'express';
import { deviceStates } from './DeviceStates';
import { ISerial, MockSerial } from './MockSerial';
import fs from 'fs';
import { ISchedule, emptySchedule, DayID, TimeID } from "./EmptySchedule";
import { ZoneID, zones } from "./Zones";
import cors from 'cors';
import { sendQueue } from "./SendQueue";

const app = express()
app.use(cors({
    origin: '*'
}));
const port = 3000;

if (!fs.existsSync("schedule.json")) {
    saveScheduleFile(emptySchedule);
}

const currentScheduleRaw = fs.readFileSync("schedule.json", "utf8");
let currentSchedule: ISchedule = JSON.parse(currentScheduleRaw) || emptySchedule;

raspi.init(() => {
    let stringData = "";

    let serial: ISerial;

    if (require('os').platform() === 'linux' && (require('os').arch() === 'arm' || require('os').arch() === 'arm64')) {
        const Serial = require('raspi-serial').Serial;
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
        console.log(`Listening on port ${port}`)
    });

    app.get('/', (req, res) => {
        res.send('OK')
    });

    app.get('/deviceStates', (req, res) => {
        res.send(deviceStates);
    });

    app.get('/zones', (req, res) => {
        res.send(zones);
    });

    app.get('/schedule', (req, res) => {
        res.send(currentSchedule);
    });

    app.get('/sendQueue', (req, res) => {
        res.send(sendQueue);
    });

    app.get('/init', (req, res) => {
        res.send({
            zones,
            deviceStates,
            schedule: currentSchedule,
            sendQueue
        });
    });

    app.get('/create-empty-schedule', (req, res) => {
        saveScheduleFile(emptySchedule);
        res.send(emptySchedule);
    });

    app.get('/set-schedule', (req, res) => {
        // query params: 
        // day: string, ex: "0" for Monday
        // time: string, ex: "12" for noon
        // zone: string, ex: "A1"
        // isDefault: boolean, ex: true

        const day = parseInt(req.query.day as string, 10);
        const time = parseInt(req.query.time as string, 10);
        const zone = req.query.zone as ZoneID;
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
        const daySchedule = schedule[day.toString() as DayID];
        const hourSchedule = daySchedule.schedule[time.toString() as TimeID];

        if (isDefault) {
            hourSchedule.default = [zone];
        } else {
            hourSchedule.overrides = [zone];
        }

        // if it is the current day and hour, push the command to the sendQueue
        const date = new Date();
        const adjustedDay = (date.getDay() - 1 + 7) % 7;
        const hour = date.getHours();

        const deviceID = zone[0];
        const valveLetter = zone[1] as "A" | "B";

        if (day === adjustedDay && time === hour) {
            const command = `|${deviceID}${valveLetter === 'A' ? '1' : '0'}${valveLetter === 'B' ? '1' : '0'}|`;
            console.log("Pushing command to sendQueue", command);
            sendQueue.push({
                deviceID,
                command
            });
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
        const controllerDeviceIds = Object.keys(deviceStates);

        console.log("");
        console.log("Filling queue");
        console.log("---------------------------");

        for (let i = 0; i < controllerDeviceIds.length; i++) {
            const deviceID = controllerDeviceIds[i];
            const deviceState = deviceStates[deviceID];
            deviceState.desiredValveState = { A: false, B: false };
            deviceState.OK = false;

            const valveState = getScheduleCommand(deviceID);
            if (valveState) {
                deviceState.desiredValveState[valveState] = true;
            }

            const command = `|${deviceID}${deviceState.desiredValveState.A ? 1 : 0}${deviceState.desiredValveState.B ? 1 : 0}|`;

            sendQueue.push({
                deviceID,
                command
            });
        }
    }

    fillQueue(); // fill the queue on startup

    setInterval(async () => {
        fillQueue();
    }, 30000); // fill the queue every 30 seconds

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
    
    function checkDeviceState(deviceID: string) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(false);  // Resolve as false after 2 seconds
        }, 2000);
    
        const checkState = () => {
          const deviceState = deviceStates[deviceID];
          if (deviceState.OK) {
            clearTimeout(timeout);
            resolve(true);
          } else {
            setTimeout(checkState, 100);  // Check every 100 ms
          }
        };
    
        checkState();
      });
    }
    
    async function processQueue() {
      if (isProcessing || sendQueue.length === 0) return;
    
      isProcessing = true;
      const sendItem = sendQueue.shift();
    
      if (!sendItem) {
        isProcessing = false;
        return;
      }
    
      sendMessage(sendItem.command);
    
      const isOk = await checkDeviceState(sendItem.deviceID);
      if (isOk) {
        process.stdout.write(`OK\n`);
      } else {
        process.stdout.write(`NOT OK\n`);
      }

      isProcessing = false;
      processQueue();
    }
    
    // Start processing queue
    setInterval(processQueue, 5000);  // This continues to check if it should process the queue
    


    function sendMessage(message: string) {
        process.stdout.write(`Sending: ${message} ... `);
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

function saveScheduleFile(schedule: ISchedule) {
    currentSchedule = schedule;

    fs.writeFile("schedule.json", JSON.stringify(schedule), (err) => {
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
        const daySchedule = currentSchedule[i.toString() as DayID];
        for (let j = 0; j < 24; j++) {
            const hourSchedule = daySchedule.schedule[j.toString() as TimeID];
            hourSchedule.overrides = [];
        }
    }

    saveScheduleFile(currentSchedule);
}


function getScheduleCommand(deviceID: string): "A" | "B" | "" {
    const date = new Date();
    const adjustedDay = (date.getDay() - 1 + 7) % 7;
    const hour = date.getHours();
    const daySchedule = currentSchedule[adjustedDay];

    const scheduleCommand = daySchedule.schedule[hour as unknown as TimeID];
    const currentCommand = scheduleCommand.overrides[0] || scheduleCommand.default[0];

    if (!currentCommand) {
        return "";
    }

    const commandDeviceID = currentCommand[0];
    const valveLetter = currentCommand[1] as "A" | "B";

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

