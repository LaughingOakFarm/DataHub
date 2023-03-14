// This function is the webhook's request handler.
exports = function(payload, response) {
  
    let body = payload.body.text();
    body = JSON.parse(body);
    
    console.log("Request body:", body);
    
    const result = context.functions.execute("SaveData", body);

    return {
      "Devices": context.functions.execute("DeviceStatuses"),
      "ControlQueue": context.functions.execute("ControlQueue"),
    };
};