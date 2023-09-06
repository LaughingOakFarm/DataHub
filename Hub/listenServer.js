const deviceStates = require('./deviceStates.js').deviceStates;
const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;
const express = require('express');
const app = express()
const port = 3000;
const normalSchedule = require('./schedule.js').schedule;
const { overrideSchedule, sleep, getScheduleCommand, parseControllerData, resetScheduleAtMidnight } = require('./common.js');

const activeSchedule = { ...normalSchedule };

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

    // get request to get the current schedule
    app.get('/schedule', (req, res) => {
        res.send(activeSchedule);
    });

    // get request to get the current device states
    app.get('/deviceStates', (req, res) => {
        res.send(deviceStates);
    });

    // get request to override the schedule for a day / hour
    app.get('/override', (req, res) => {
        const deviceID = req.query.deviceID;
        const valve = req.query.valve;
        const hour = req.query.hour;
        const day = req.query.day;

        if (!deviceID || !valve || !hour || !day) {
            res.send('Invalid request');
            return;
        }

        overrideSchedule(activeSchedule, deviceID, valve, hour, day);

        res.send('OK');
    });

    // send a request for each controller every 10 seconds
    // get the valve states from the schedule
    setInterval(async () => {
        loop();

        resetScheduleAtMidnight();

        console.log("---------");
    }, 40000);

    async function loop() {
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
    }

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
