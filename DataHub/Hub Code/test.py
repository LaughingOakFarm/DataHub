 #!/usr/bin/env python
import serial, time
from urllib.parse import parse_qsl
from datetime import datetime
import requests

HC12 = serial.Serial(
  port='/dev/ttyS0',
  baudrate = 9600,
  parity=serial.PARITY_NONE,
  stopbits=serial.STOPBITS_ONE,
  bytesize=serial.EIGHTBITS,
  timeout=1
)

requestPassword = 'v9zt78'

while(1):
    HC12.write(b'Q')
    
    try:
        queryString = HC12.readline().decode().lstrip('\n\r')
    except UnicodeDecodeError:
        print("Bad data received.")
        time.sleep(1)
        continue
        
    #print(queryString)
    
    sensorData = dict(parse_qsl(queryString))
    
    today = datetime.now().timestamp()
    
    sensorData['Timestamp'] = round(today)
    #print(sensorData)
    
    url = 'https://us-west-2.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/datahub-pwvbn/service/Sensors/incoming_webhook/DataImport?secret='+requestPassword
    
    try:
        res = requests.post(url, json = sensorData)
    except OSError:
        print("A request error happened.")
        time.sleep(1)
        continue

    if res.status_code == 200:
        print("Successful Request: ", sensorData)
    
    time.sleep(1)

ser.close()
