  /*
    Accessing application's values:
    var x = context.values.get("value_name");

    Accessing a mongodb service:
    var collection = context.services.get("mongodb-atlas").db("dbname").collection("coll_name");
    var doc = collection.findOne({owner_id: context.user.id});

    To call other named functions:
    var result = context.functions.execute("function_name", arg1, arg2);

    TESTS:
    exports({'DID': '4', 'QID': '39', 'BV': '4.04', 'BL': '79', 'SV': '0.43', 'FS:A': '1', 'FS:B': '1', 'VC:A': 'O', 'VC:B': 'C', 'Timestamp': 1619322594, 'Test': true})
  */

exports = function(rawData) {
  var keys = {
    'QID':  'QueryID:number',
    'BV':   'Device.BatteryVoltage:number',
    'BL':   'Device.BatteryLevel:number',
    'SV':   'Device.SolarVoltage:number',
    'T': 'Device.Temperature:number',
    'H': 'Device.Humidity:number',
    
    'FS:A': 'Sensors.FloatSensorA:number',
    'FS:B': 'Sensors.FloatSensorB:number',
    'BH:A': 'Sensors.BeehiveAWeight:number',
    'BH:B': 'Sensors.BeehiveBWeight:number',
    
    'VC:A': 'Controls.ValveA:string',
    'VC:B': 'Controls.ValveB:string',
  };
  
  var deviceID = rawData.DID*1;
  
  // Get Device
  var devices = context
    .services
    .get("mongodb-atlas")
    .db("Devices")
    .collection("Devices");
    
  var device = devices.findOne({DeviceID: deviceID})
    .then(device => {
      console.log(JSON.stringify(device));
    
      var deviceType = "unknown";
      if(device && device.Type) {
        deviceType = device.Type;
      }
      var deviceName = "--";
      if(device && device.Name) {
        deviceName = device.Name;
      }
      
      // Create Sensor Data Record
      let data = {
        QueryID: 0,
        Timings: {
          QueryTS: new Date( rawData.Timestamp * 1000 ),
          StorageTS: new Date(),
          StorageLatencyMS: null
        },
        Device: {
          ID: deviceID,
          Name: deviceName,
          Type: deviceType,
        },
        Sensors: {},
        Controls: {}
      };
      data.Timings.StorageLatencyMS = data.Timings.StorageTS - data.Timings.QueryTS;
      
      for (const [label, value] of Object.entries(rawData)) {
        if(typeof keys[label] !== 'undefined') {
          var [key, type] = keys[label].split(":");
          var [topLevelKey, secondLevelKey] = key.split(".");
          
          var typedValue = value;
          if(type === 'number') {
            typedValue = value*1;
          } else if(type === 'string') {
            typedValue = value.toString();
          }
          
          if(typeof secondLevelKey !== "undefined") {
            data[topLevelKey][secondLevelKey] = typedValue;
          } else {
            data[topLevelKey] = typedValue;
          }
        }
      }
      
      // Save the Sensor Data
      collectionName = "Readings";
      if(rawData.Test) {
        collectionName = "TestReadings";
        console.log(JSON.stringify(data));
      }
      
      var readings = context
      .services
      .get("mongodb-atlas")
      .db("Devices")
      .collection(collectionName);
      
      var insertResult = readings.insertOne(data);
    
      if(deviceType !== "unknown") {
        device.LastReading = data.Timings.QueryTS;
        device.Falures = 0;
        device.Status = "active";
        
        if(typeof device.Controls !== "undefined") {
          for (let index in device.Controls) {
            controlObject = device.Controls[index];
            if(controlObject.ControlID === "A") {
              controlObject.Status = data.Controls.ValveA;
            } else if(controlObject.ControlID === "B") {
              controlObject.Status = data.Controls.ValveB;
            }
              
            if(controlObject.Status === "C") {
              controlObject.Status = "Closed";
            } else if(controlObject.Status === "O") {
              controlObject.Status = "Open";
            }
            
            device.Controls[index] = controlObject;
          }
        }
        
        devices.findOneAndReplace({DeviceID: deviceID}, device, { "returnNewDocument": false });
      }
    })
    .catch(err => console.error(`Failed to find document: ${err}`));

  return true;
};