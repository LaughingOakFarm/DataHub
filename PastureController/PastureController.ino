// INCLUDES
#include <SoftwareSerial.h>
#include <EEPROM.h>
#include <Battery.h>
#include <MX1508.h>
#include <SimpleDHT.h>


// DEFAULT CONTROL PINOUT
int SoftwareTXPin        = 11;
int SoftwareRXPin        = 10;
int HC12SetPin           = 12;
int MotorAIn1Pin         = 5;
int MotorAIn2Pin         = 3;
int MotorBIn1Pin         = 9;
int MotorBIn2Pin         = 6;
int FloatSensorAPin      = 4;
int Regulator12VPin      = 2;
int BatteryVoltagePin    = A0;
int SolarPanelVoltagePin = A1;

// CUSTOM PINOUTL: A2-A7
int FloatSensorBPin = 13;
int DHT11Pin = 8;  // aka 11 on the PCB
int UnusedPin7 = 7; // aka 10 on the PCB
int PressureSensorBPin = A2;


Battery battery(3400, 4200, BatteryVoltagePin);
SoftwareSerial HC12(SoftwareTXPin, SoftwareRXPin);
MX1508 motorA(MotorAIn1Pin, MotorAIn2Pin);
MX1508 motorB(MotorBIn1Pin, MotorBIn2Pin);
SimpleDHT11 dht11(DHT11Pin);
short DeviceID;
int QueryID;
String Query;
bool debug = false;

struct Command {
  char source; // w = wireless, s = serial
  String rawCommand; 
  String commandAction; // "Q", "C"
  int deviceID; // 1-99
  String controlID; // "A", "C"
  String controlAction; // "O", "C"
};

struct Control {
  String controlID;
  String actionStatus;
};

Command command = {};
Control controlA = {"A"};
Control controlB = {"B"};


void setup() {
  Serial.begin(9600);
  HC12.begin(9600);
  battery.begin(5000, 1.0);

  pinMode(HC12SetPin, OUTPUT);
  pinMode(Regulator12VPin, OUTPUT);
  pinMode(BatteryVoltagePin, INPUT);
  pinMode(SolarPanelVoltagePin, INPUT);
  pinMode(FloatSensorAPin, INPUT_PULLUP);
  pinMode(FloatSensorBPin, INPUT_PULLUP);
  
  DeviceID = EEPROM.read(10);
  Serial.print("Device ID: ");
  Serial.println(DeviceID);

  if(DeviceID < 1 || DeviceID > 99) {
    Serial.println("No Device ID! Please set one!");
  }

  // enable debug mode
  debug = true;

  // Set Correct HC-12 mode
  digitalWrite(HC12SetPin, LOW);
  delay(500);
  HC12.println("AT+DEFAULT");
  delay(500);
  HC12.println("AT+C011");
  delay(500);
  digitalWrite(HC12SetPin, HIGH);
}


void loop() {
  if(hasNewCommand()) {
    if(command.deviceID == DeviceID) {
      if(command.commandAction == "C") {
        runControlAction();
      } else {
        sendQueryResponse();
      }
    } else {
      if(debug) {
        Serial.println("Command not intended for this device.");
      }
    }

    command = {};
  }
}


bool hasNewCommand() {
  if(HC12.available()) {
    char CommandByte = HC12.read();

    if(CommandByte == '\n') {
      // Process the command
      parseCommand();
      return true;
    }
    
    if(command.source == 'w' || !command.source) {
      command.source = 'w';
      command.rawCommand += CommandByte;
    }
  }

  if(Serial.available()) {
    char CommandByte = Serial.read();

    if(CommandByte == '\n') {
      // Process the command
      parseCommand();
      return true;
    }
    
    if(command.source == 's' || !command.source) {
      command.source = 's';
      command.rawCommand += CommandByte;
    }
  }

  return false;
}


void parseCommand() {
  command.rawCommand.trim();
  
  command.commandAction = command.rawCommand.substring(0, 1);
  command.deviceID      = command.rawCommand.substring(1, 3).toInt();
  command.controlID     = command.rawCommand.substring(3, 4);
  command.controlAction = command.rawCommand.substring(4, 5);

  if(debug) {
    if(command.commandAction != "Q" && command.commandAction != "C") {
      Serial.println("Invalid Command Action: "+command.commandAction);
    }
    if(command.controlAction != "O" && command.controlAction != "C") {
      Serial.println("Invalid Control Action: "+command.controlAction);
    }
    if(command.deviceID < 1 || command.deviceID > 99) {
      Serial.println("Invalid Device ID: "+command.deviceID);
    }
    if(command.controlID != "A" && command.controlID != "B") {
      Serial.println("Invalid Control ID: "+command.controlID);
    }

    Serial.println("Command Action: "+String(command.commandAction));
    Serial.println("Device ID: "+String(command.deviceID));
    Serial.println("Control ID: "+String(command.controlID));
    Serial.println("Control Action: "+String(command.controlAction));
    Serial.println("Raw: "+String(command.rawCommand));
    Serial.println("Source: "+String(command.source));
  }
}


void runControlAction() {
  if(command.controlID == "A" && command.controlAction == "O") {
    controlA.actionStatus = command.controlAction;
    sendQueryResponse();
    toggleValve(motorA, 255);
  } else if(command.controlID == "A" && command.controlAction == "C") {
    controlA.actionStatus = command.controlAction;
    sendQueryResponse();
    toggleValve(motorA, -255);
  } else if(command.controlID == "B" && command.controlAction == "O") {
    controlB.actionStatus = command.controlAction;
    sendQueryResponse();
    toggleValve(motorB, 255);
    controlB.actionStatus = command.controlAction;
  } else if(command.controlID == "B" && command.controlAction == "C") {
    controlB.actionStatus = command.controlAction;
    sendQueryResponse();
    toggleValve(motorB, -255);
  }
}


void sendQueryResponse() {
  QueryID++;

  float solarVoltage = (map(analogRead(SolarPanelVoltagePin), 0, 1023, 0, 500000)*0.00001) * 11;
  byte temperature = 0;
  byte humidity = 0;
  int err = SimpleDHTErrSuccess;
  if ((err = dht11.read(&temperature, &humidity, NULL)) != SimpleDHTErrSuccess) {
    Serial.print("Read DHT11 failed, err="); Serial.print(SimpleDHTErrCode(err));
    Serial.print(","); Serial.println(SimpleDHTErrDuration(err));
  }
  
  Query += String("DID=")+DeviceID+String("&");
  Query += String("QID=")+QueryID+String("&");
  Query += String("BV=")+String(battery.voltage()*0.001)+String("&");
  Query += String("BL=")+String(battery.level())+String("&");
  Query += String("SV=")+String(solarVoltage)+String("&");
  Query += String("H=")+String(humidity)+String("&");
  Query += String("T=")+String(temperature)+String("&");
  Query += String("VC:A=")+String(controlA.actionStatus)+String("&");
  Query += String("VC:B=")+String(controlB.actionStatus)+String("&");
  Query += String("FS:A=")+String(digitalRead(FloatSensorAPin))+String("&");
  Query += String("FS:B=")+String(digitalRead(FloatSensorBPin))+String("&");
  
  HC12.println(Query);

  if(debug) {
    Serial.print("Sent: ");
    Serial.println(Query); 
  }

  Query = String();
}


void toggleValve(MX1508 motor, int dir) {
  digitalWrite(Regulator12VPin, HIGH);
  delay(100);
  
  motor.motorGo(dir);
  delay(8000);
  motor.stopMotor();

  delay(100);
  digitalWrite(Regulator12VPin, LOW);
}
