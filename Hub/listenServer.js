const deviceStates = require('./deviceStates.js').deviceStates;
const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;
const express = require('express');
const app = express()
const port = 3000;
const schedule = require('./schedule.js').schedule;

raspi.init(() => {
    let stringData = "";

    const serial = new Serial({
        portId: "/dev/ttyS0",
        baudRate: 9600,
        parity: Serial.PARITY_NONE
    });

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
            deviceState.desiredValveState = { A: false, B: false, C: false };
            deviceState.OK = false;

            const valveState = getScheduleCommand(deviceID);
            if (valveState) {
                deviceState.desiredValveState[valveState] = true;
            }

            // try 1 times to get a response
            for (let j = 0; j < 1; j++) {
                sendMessage(
                    `|${deviceID}${deviceState.desiredValveState.A ? 1 : 0
                    }${deviceState.desiredValveState.B ? 1 : 0}${deviceState.desiredValveState.C ? 1 : 0
                    }|`
                );

                await sleep(2000);

                if (deviceState.OK) {
                    console.log("Device " + deviceID + " OK");
                    break;
                }

                await sleep(2000);
                console.log("Device " + deviceID + " not OK, trying again.");
            }

            await sleep(2000);
        }

        console.log("---------");
    }, 40000);

    function sendMessage(message) {
        console.log("Sending: ", message);
        serial.write(message);
    }

    async function collectData(byteArray) {
        const byteString = String.fromCharCode(...byteArray);
        stringData += byteString;

        if (stringData.includes('|')) {
            const commandArray = stringData.split('|');
            const newCommand = commandArray.shift();
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

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getScheduleCommand(deviceID) {
    const date = new Date();
    const adjustedDay = (date.getDay() - 1 + 7) % 7;
    const hour = date.getHours();
    // add a leading zero to the hour if needed
    const time = `${hour < 10 ? '0' : ''}${hour}:00`;
    const daySchedule = schedule.days[adjustedDay];

    const scheduleCommand = daySchedule.schedule[time];
    if (!scheduleCommand) {
        return false;
    }

    const commandDeviceID = scheduleCommand[0];
    const valveLetter = scheduleCommand[1];

    if (deviceID != commandDeviceID) {
        return false;
    }

    return valveLetter;
}

function getScheduleCommandTest(deviceID) {
    const date = new Date();
    const adjustedDay = (date.getDay() - 1 + 7) % 7;
    const hour = date.getHours();

    // add a leading zero to the hour if needed
    const time = `${hour < 10 ? '0' : ''}${hour}:00`;
    const daySchedule = schedule.days[adjustedDay];
    const minute = date.getMinutes();
    console.log("Minute: ", minute);

    // every other 7 seconds turn on a different valve

    // if the deviceID is 1, then turn on valve for every other 7 minutes
    if (deviceID === 1 && [0, 7, 14, 21, 28, 35, 42, 49, 56].includes(minute)) {
        return 'A';
    } else if (deviceID == 1 && [1, 8, 15, 22, 29, 36, 43, 50, 57].includes(minute)) {
        return 'B';
    } else if (deviceID == 2 && [2, 9, 16, 23, 30, 37, 44, 51, 58].includes(minute)) {
        return 'A';
    } else if (deviceID == 2 && [3, 10, 17, 24, 31, 38, 45, 52, 59].includes(minute)) {
        return 'B';
    } else if (deviceID == 2 && [4, 11, 18, 25, 32, 39, 46, 53].includes(minute)) {
        return 'C';
    } else if (deviceID == 3 && [5, 12, 19, 26, 33, 40, 47, 54].includes(minute)) {
        return 'B';
    } else if (deviceID == 4 && [6, 13, 20, 27, 34, 41, 48, 55].includes(minute)) {
        return 'A';
    }

    return false;
}

// Data format: DID=1&TID=-14282&H=50.00&T=69.98&A=1&B=1&C=0
function parseControllerData(data) {
    const dataObject = {};
    const dataArray = data.split('&');
    dataArray.forEach((item) => {
        const itemArray = item.split('=');
        dataObject[itemArray[0]] = itemArray[1];
    });

    return dataObject;
}

