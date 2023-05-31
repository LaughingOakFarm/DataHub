const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;
const express = require('express');
const app = express()
const port = 3000;
const deviceStates = {
    1: {
        deviceID: 1,
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: false
        }
    },
    2: {
        deviceID: 2,
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: false
        }
    },
    3: {
        deviceID: 3,
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: false
        }
    },
    4: {
        deviceID: 4,
        OK: false,
        desiredValveState: {
            A: false,
            B: false,
            C: false
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
        
            // try 3 times to get a response
            for (let j = 0; j < 3; j++) {
              sendMessage(
                `|${deviceID}${
                  deviceState.desiredValveState.A ? 1 : 0
                }${deviceState.desiredValveState.B ? 1 : 0}${
                  deviceState.desiredValveState.C ? 1 : 0
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
    }, 30000);
  
  function sendMessage(message) {
    console.log("Sending: ", message);
    serial.write(message);
  }

  async function collectData(byteArray) {
    const byteString = String.fromCharCode(...byteArray);
    stringData += byteString;
        
    if(stringData.includes('|')) {
      const commandArray = stringData.split('|');
      const newCommand = commandArray.shift();
    //   console.log("Full Data: ", newCommand);
      const commandObject = parseControllerData(newCommand);

      if(commandObject) {        
        if(commandObject.OK === '1' && commandObject.DID) {
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
    if(!scheduleCommand) {
        return false;
    }

    const commandDeviceID = scheduleCommand[0];
    const valveLetter = scheduleCommand[1];

    if(deviceID != commandDeviceID) {
        return false;
    }

    return valveLetter;
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
                "00:00": "3B",
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
                "15:00": "4A",
                "16:00": "4A",
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
                "15:00": "",
                "16:00": "",
                "17:00": "",
                "18:00": "",
                "19:00": "1A",
                "20:00": "1A",
                "21:00": "1A",
                "22:00": "1A",
                "23:00": "3B"
            }
            
        },
        {
            name: "Wednesday",
            schedule: {
                "00:00": "3B",
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
                "16:00": "4A",
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
                "15:00": "",
                "16:00": "",
                "17:00": "",
                "18:00": "1B",
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
                "00:00": "3B",
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
                "15:00": "4A",
                "16:00": "4A",
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
            name: "Saturday",
            schedule: {
                "00:00": "2B",
                "01:00": "2C",
                "02:00": "2B",
                "03:00": "2C",
                "04:00": "2B",
                "05:00": "2C",
                "06:00": "2B",
                "07:00": "",
                "08:00": "",
                "09:00": "",
                "10:00": "",
                "11:00": "",
                "12:00": "",
                "13:00": "",
                "14:00": "",
                "15:00": "4A",
                "16:00": "4A",
                "17:00": "",
                "18:00": "",
                "19:00": "1A",
                "20:00": "1A",
                "21:00": "1A",
                "22:00": "1A",
                "23:00": "3B"
            }
        },
        {
            name: "Sunday",
            schedule: {
                "00:00": "3B",
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
                "18:00": "1B",
                "19:00": "2A",
                "20:00": "1B",
                "21:00": "2A",
                "22:00": "1B",
                "23:00": "2A"
            }
        }
    ]
}; 

