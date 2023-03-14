exports = async function() {
  const sns = context.services.get('PersonalAWS').sns("us-west-1");
  const result = await sns.Publish({
    "Message": "Test Message",
    "TopicArn": "arn:aws:sns:us-west-1:993006048602:DeviceTemperatureNotification",
  });
  console.log(EJSON.stringify(result));
  return result;
};