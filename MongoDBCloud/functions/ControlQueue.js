exports = function(){
  
  var itemsCollection = context
    .services
    .get("mongodb-atlas")
    .db("Devices")
    .collection("ControlQueue");

  return itemsCollection.find()
    .toArray()
    .then(items => {
      return items;
    })
    .catch(err => console.error(`Failed to find documents: ${err}`));
};