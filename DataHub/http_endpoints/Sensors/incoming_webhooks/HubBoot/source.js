exports = function(payload, response) {
    return {
      "Devices": context.functions.execute("DeviceStatuses"),
      "ControlQueue": context.functions.execute("ControlQueue"),
    };
};