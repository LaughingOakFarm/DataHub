 #!/usr/bin/env python
import serial, time
from urllib.parse import parse_qsl
from datetime import datetime
import requests
import RPi.GPIO as GPIO

GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)
GPIO.setup(4, GPIO.OUT)
GPIO.output(4, 1)

HC12 = serial.Serial(
  port='/dev/ttyS0',
  baudrate = 1200,
  parity=serial.PARITY_NONE,
  stopbits=serial.STOPBITS_ONE,
  bytesize=serial.EIGHTBITS,
  timeout=10
)

while(1):
#     HC12.write(b'C');
#     print("Sent C")
#     time.sleep(1)
    
    try:
        queryString = HC12.readline().decode().rstrip('\r\n')
        if(queryString): 
            print("'"+queryString+"'")
            
    except UnicodeDecodeError:
        print("Bad data received.")
        time.sleep(1)
        continue
            
    if(queryString == "1234567890"):
        HC12.write(b'C')
        print("Sent C")
        
ser.close()

