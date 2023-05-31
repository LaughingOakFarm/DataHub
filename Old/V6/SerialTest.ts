const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;
const express = require('express')
const app = express()
const port = 3000

raspi.init(() => {
    let stringData = "";

    const serial = new Serial({
        portId: "/dev/ttyS0"
    });

    serial.open(() => {
        serial.on('data', (data) => {
            collectData(data);
        });
    });

    app.get('/', (req, res) => {
        res.send('<a href="/open">Open</a> <a href="/close">Close</a>');
    });

    app.get('/openA', (req, res) => {
        res.send('Opening A');
        sendResponse('C01AO|');
    });

    app.get('/closeA', (req, res) => {
        res.send('Closing A');
        sendResponse('C01AC|');
    });

    app.get('/openB', (req, res) => {
        res.send('Opening B');
        sendResponse('C01BO|');
    });

    app.get('/closeB', (req, res) => {
        res.send('Closing B');
        sendResponse('C01BC|');
    });

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    });

    function sendResponse(message) {
        serial.write(message);
        console.log("Response: ", message);
    }

    function collectData(byteArray) {
        const byteString = String.fromCharCode(...byteArray);
        stringData += byteString;

        if(stringData.includes('|')) {
            const commandArray = stringData.split('|');
            const newCommand = commandArray.shift();
            console.log("Full Data: ", newCommand);
            stringData = commandArray.join('|');

            //sendResponse('C01BC|');
        }
    }
});
