exports = function(DID, CID, Action){
  var collection = context
  .services
  .get("mongodb-atlas")
  .db("Devices")
  .collection("ControlQueue");
  collection.deleteMany({"DeviceID": DID, "ControlID": CID, "Action": Action});
  
  return true;
};