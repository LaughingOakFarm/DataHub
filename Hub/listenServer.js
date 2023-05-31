const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;
const express = require('express');
const app = express()
const port = 3000;
const deviceStates = {
    1: {
        deviceID: 1,
        temperature: 0,
        humidity: 0,
        desiredValveState: {
            A: false,
            B: false,
            C: false
        },
        currentValveState: {
            A: false,
            B: false,
            C: false
        }
    },
    2: {
        deviceID: 2,
        temperature: 0,
        humidity: 0,
        desiredValveState: {
            A: false,
            B: false,
            C: false
        },
        currentValveState: {
            A: false,
            B: false,
            C: false
        }
    },
    3: {
        deviceID: 3,
        temperature: 0,
        humidity: 0,
        desiredValveState: {
            A: false,
            B: false,
            C: false
        },
        currentValveState: {
            A: false,
            B: false,
            C: false
        }
    },
    4: {
        deviceID: 4,
        temperature: 0,
        humidity: 0,
        desiredValveState: {
            A: false,
            B: false,
            C: false
        },
        currentValveState: {
            A: false,
            B: false,
            C: false
        }
    }
};


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
  
  function sendResponse(message) {
    serial.write(message);
    console.log("Response: ", message);
  }

  async function collectData(byteArray) {
    const byteString = String.fromCharCode(...byteArray);
    stringData += byteString;
        
    if(stringData.includes('|')) {
      const commandArray = stringData.split('|');
      const newCommand = commandArray.shift();
      const commandObject = parseControllerData(newCommand);

      if(commandObject) {
        const deviceID = commandObject.DID;
        const okCommand = updateDeviceState(commandObject);

        if(okCommand) {
            await sleep(500);
            sendResponse(getResponse(deviceID));
        }
      }
      
      console.log("Full Data: ", newCommand);
      stringData = commandArray.join('|');
    }
  }
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// response format 1000
// 1 = device ID
// 0 = valve A
// 0 = valve B
// 0 = valve C
// using this schedule, look up the time and return the correct format
function getResponse(deviceID) {
    const date = new Date();
    const adjustedDay = (date.getDay() - 1 + 7) % 7;
    const hour = date.getHours();
    const minute = date.getMinutes();
    // add a leading zero to the hour if needed
    const time = `${hour < 10 ? '0' : ''}${hour}:00`;
    const daySchedule = schedule.days[adjustedDay];
    
    // is an array of A1, etc
    // where A is the valve and 1 is the device ID
    let scheduleData = daySchedule.schedule[time];
    // console.log("day", daySchedule);
    if(scheduleData === "") {
        scheduleData = '--';
    }
    console.log("Looking Up: ", daySchedule.name, time);
    // console.log("Schedule Data: ", scheduleData);
    const dID = scheduleData[0];
    let valveLetter = scheduleData[1];
    if(dID != deviceID) {
        console.log("Device ID does not match: "+ dID + " != " + deviceID);
        valveLetter = '-';
    }

    let valveA = '0';
    let valveB = '0';
    let valveC = '0';
    // if(deviceID == 2) {
    //     // if the minute is odd then turn on valve A, opposite for valve B
    //     valveA = minute % 2 === 1 ? '1' : '0';
    //     valveB = minute % 2 === 0 ? '1' : '0';
    //     valveC = minute % 2 === 0 ? '1' : '0';
    // } else {
        // if valve A is on, the the second charater in the response is 1
        // if valve B is on, the the third charater in the response is 1
        // if valve C is on, the the fourth charater in the response is 1
        valveA = valveLetter === 'A' ? '1' : '0';
        valveB = valveLetter === 'B' ? '1' : '0';
        valveC = valveLetter === 'C' ? '1' : '0';
    // }

    // update the device state
    const deviceState = deviceStates[deviceID];
    if(!deviceState) {
        console.log("Device ID not found: ", deviceID);
        return false;
    }

    deviceState.desiredValveState.A = valveA === '1' ? true : false;
    deviceState.desiredValveState.B = valveB === '1' ? true : false;
    deviceState.desiredValveState.C = valveC === '1' ? true : false;

    return `|${deviceID}${valveA}${valveB}${valveC}|`;
}


// Data format: DID=1&TID=-14282&H=50.00&T=69.98&A=1&B=1&C=0
function parseControllerData(data) {
    if(data === "OK") return false;

    const dataObject = {};
    const dataArray = data.split('&');
    dataArray.forEach((item) => {
        const itemArray = item.split('=');
        dataObject[itemArray[0]] = itemArray[1];
    });
    
    return dataObject;
}

function updateDeviceState(data) {
    console.log("Updating Device State: ", data);
    const goodKeys = [
        "DID",
        "TID",
        "H",
        "T",
        "A",
        "B",
        "C"
    ];
    // check to make sure all the keys are there
    let dataIsGood = true;
    goodKeys.forEach((key) => {
        if(!data[key]) {
            console.log("Missing Key: ", key);
            dataIsGood = false;
        }
    });
    if(!dataIsGood) {
        console.log("Bad Data: ", data);
        return false;
    }

    const deviceID = data.DID;
    const deviceState = deviceStates[deviceID];
    deviceState.temperature = data.T;
    deviceState.humidity = data.H;
    deviceState.currentValveState.A = data.A === '1' ? true : false;
    deviceState.currentValveState.B = data.B === '1' ? true : false;
    deviceState.currentValveState.C = data.C === '1' ? true : false;

    console.log("Device State: ", deviceState);

    return true;
}

// Add an event listener for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Unhandled exception:', error);

    // Exit the process with an error code
    process.exit(1);
});


// schedule of when to turn on each valve
const schedule = {
    zones: {
        "1A":{
            name: "Girls Zone (5)",
            type: "pasture",
            deviceID: 1,
            valve: "A",
        },
        "1B":{
            name: "Pond Zone (3)",
            type: "pasture",
            deviceID: 1,
            valve: "B",
        },
        "2A":{
            name: "Oak Zone (4)",
            type: "pasture",
            deviceID: 2,
            valve: "A",
        },
        "2B":{
            name: "Boys Zone (3)",
            type: "pasture",
            deviceID: 2,
            valve: "B",
        },
        "2C":{
            name: "Bottom Zone (4)",
            type: "pasture",
            deviceID: 2,
            valve: "C",
        },
        "3A":{
            name: "Pond Fill (1)",
            type: "pond",
            deviceID: 3,
            valve: "A",
        },
        "3B":{
            name: "Pond Path (2)",
            type: "lawn",
            deviceID: 3,
            valve: "B",
        },
        "4A":{
            name: "Lawn (5)",
            type: "lawn",
            deviceID: 4,
            valve: "A",
        }
    },

    days: [
        {
            name: "Monday",
            schedule: {
                "00:00": "1B",
                "01:00": "2A",
                "02:00": "1B",
                "03:00": "2A",
                "04:00": "1B",
                "05:00": "2A",
                "06:00": "1B",
                "07:00": "3A",
                "08:00": "3A",
                "09:00": "",
                "10:00": "",
                "11:00": "",
                "12:00": "",
                "13:00": "",
                "14:00": "",
                "15:00": "",
                "16:00": "",
                "17:00": "",
                "18:00": "",
                "19:00": "2C",
                "20:00": "2B",
                "21:00": "2C",
                "22:00": "2B",
                "23:00": "2C"
            }
        },
        {
            name: "Tuesday",
            schedule: {
                "00:00": "2B",
                "01:00": "2C",
                "02:00": "2B",
                "03:00": "2C",
                "04:00": "2B",
                "05:00": "2C",
                "06:00": "2B",
                "07:00": "3A",
                "08:00": "3A",
                "09:00": "",
                "10:00": "",
                "11:00": "",
                "12:00": "",
                "13:00": "",
                "14:00": "",
                "15:00": "4A",
                "16:00": "3B",
                "17:00": "",
                "18:00": "",
                "19:00": "1A",
                "20:00": "1A",
                "21:00": "1A",
                "22:00": "1A",
                "23:00": ""
            }
            
        },
        {
            name: "Wednesday",
            schedule: {
                "00:00": "",
                "01:00": "1A",
                "02:00": "1A",
                "03:00": "1A",
                "04:00": "1A",
                "05:00": "",
                "06:00": "",
                "07:00": "3A",
                "08:00": "3A",
                "09:00": "",
                "10:00": "",
                "11:00": "",
                "12:00": "",
                "13:00": "",
                "14:00": "",
                "15:00": "",
                "16:00": "",
                "17:00": "",
                "18:00": "",
                "19:00": "3A",
                "20:00": "3A",
                "21:00": "3A",
                "22:00": "3A",
                "23:00": "3A"
            }
        },
        {
            name: "Thursday",
            schedule: {
                "00:00": "3A",
                "01:00": "3A",
                "02:00": "3A",
                "03:00": "3A",
                "04:00": "3A",
                "05:00": "3A",
                "06:00": "3A",
                "07:00": "3A",
                "08:00": "3A",
                "09:00": "",
                "10:00": "",
                "11:00": "",
                "12:00": "",
                "13:00": "",
                "14:00": "",
                "15:00": "4A",
                "16:00": "3B",
                "17:00": "",
                "18:00": "",
                "19:00": "2A",
                "20:00": "1B",
                "21:00": "2A",
                "22:00": "1B",
                "23:00": "2A"
            }
        },
        {
            name: "Friday",
            schedule: {
                "00:00": "1B",
                "01:00": "2A",
                "02:00": "1B",
                "03:00": "2A",
                "04:00": "1B",
                "05:00": "2A",
                "06:00": "1B",
                "07:00": "3A",
                "08:00": "3A",
                "09:00": "",
                "10:00": "",
                "11:00": "",
                "12:00": "",
                "13:00": "",
                "14:00": "",
                "15:00": "",
                "16:00": "",
                "17:00": "",
                "18:00": "",

                "19:00": "1B",
                "20:00": "1B",
                "21:00": "1B",
                "22:00": "1B",
                "23:00": "1B"
                // "19:00": "2C",
                // "20:00": "2B",
                // "21:00": "2C",
                // "22:00": "2B",
                // "23:00": "2C"
            }
        },
        {
            name: "Saturday",
            schedule: {
                // "00:00": "2B",
                // "01:00": "2C",
                // "02:00": "2B",
                // "03:00": "2C",
                // "04:00": "2B",
                // "05:00": "2C",
                // "06:00": "2B",
                // "07:00": "3A",
                // "08:00": "3A",
                "00:00": "1B",
                "01:00": "1B",
                "02:00": "1B",
                "03:00": "1B",
                "04:00": "1B",
                "05:00": "1B",
                "06:00": "1B",
                "07:00": "1B",
                "08:00": "1B",
                "09:00": "2C",
                "10:00": "",
                "11:00": "",
                "12:00": "",
                "13:00": "",
                "14:00": "",
                "15:00": "4A",
                "16:00": "4A", // 3B
                "17:00": "",
                "18:00": "",
                "19:00": "1A",
                "20:00": "1A",
                "21:00": "1A",
                "22:00": "1A",
                "23:00": ""
            }
        },
        {
            name: "Sunday",
            schedule: {
                "00:00": "",
                "01:00": "1A",
                "02:00": "1A",
                "03:00": "1A",
                "04:00": "1A",
                "05:00": "",
                "06:00": "",
                "07:00": "3A",
                "08:00": "3A",
                "09:00": "",
                "10:00": "",
                "11:00": "",
                "12:00": "",
                "13:00": "",
                "14:00": "",
                "15:00": "4A",
                "16:00": "3B",
                "17:00": "",
                "18:00": "",
                "19:00": "2A",
                "20:00": "1B",
                "21:00": "2A",
                "22:00": "1B",
                "23:00": "2A"
            }
        }
    ]
}; 
