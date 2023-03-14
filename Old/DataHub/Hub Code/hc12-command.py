import RPi.GPIO as GPIO
from time import sleep
import serial, time

GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)
GPIO.setup(4, GPIO.OUT)
GPIO.output(4, 0)

HC12 = serial.Serial(
  port='/dev/ttyS0',
  baudrate = 9600,
  parity=serial.PARITY_NONE,
  stopbits=serial.STOPBITS_ONE,
  bytesize=serial.EIGHTBITS,
  timeout=1
)

time.sleep(1)

HC12.write(b'AT+FU4');

while(1):
    queryString = HC12.readline()
    if(queryString): 
        print(queryString)
