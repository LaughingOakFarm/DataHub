exports = function(){
  
  var itemsCollection = context
    .services
    .get("mongodb-atlas")
    .db("Devices")
    .collection("Devices");
  const query = {Status: "active"};

  return itemsCollection.find(query)
    .sort({ DeviceID: 1 })
    .toArray()
    .then(items => {
      return items;
    })
    .catch(err => console.error(`Failed to find documents: ${err}`));
};