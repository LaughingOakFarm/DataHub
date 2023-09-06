
function overrideSchedule(activeSchedule, deviceID, valve, hour, day) {
    const daySchedule = activeSchedule.days[day];
    if (!daySchedule) {
        return false;
    }

    const time = `${hour}:00`;
    const scheduleCommand = `${deviceID}${valve}`;
    daySchedule.schedule[time] = scheduleCommand;

    return true;
}

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
    const daySchedule = activeSchedule.days[adjustedDay];

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
    const daySchedule = activeSchedule.days[adjustedDay];
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

function resetScheduleAtMidnight() {
    const date = new Date();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    if (hour === 0 && minute === 0 && second === 0) {
        resetSchedule();
    }
}

function resetSchedule() {
    console.log("Resetting schedule");
    activeSchedule = { ...normalSchedule };
}

module.exports = {
    overrideSchedule,
    sleep,
    getScheduleCommand,
    parseControllerData,
    resetScheduleAtMidnight
};
