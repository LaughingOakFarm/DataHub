exports = function(DID, CID, Action){
  var collection = context
  .services
  .get("mongodb-atlas")
  .db("Devices")
  .collection("ControlQueue");
  
  let data = {
    DeviceID: DID+"",
    ControlID: CID+"",
    Action: Action+""
  };
  
  var collection = context
  .services
  .get("mongodb-atlas")
  .db("Devices")
  .collection("ControlQueue");
  
  var insertResult = collection.insertOne(data);

  return true;
};