#include <SoftwareSerial.h>
#include <EEPROM.h>

#define MotorAIn1 3
#define MotorAIn2 5

#define MotorBIn1 6
#define MotorBIn2 9

#define MotorCIn1 2
#define MotorCIn2 4

#define MotorDIn1 7
#define MotorDIn2 8

#define MotorEIn1 A4
#define MotorEIn2 A5

#define HC12RX 11
#define HC12TX 10
#define HC12Set 12
#define LED 13

SoftwareSerial HC12(HC12TX, HC12RX);

// WIRELESS VARS
String rawCommand;

// MOTOR VARS
bool ValveA = false;
bool ValveB = false;

// DEVICE VARS
int DeviceID;
byte DeviceIDAddress = 10;

int pingCount = 0;

void(* resetFunc) (void) = 0;

void setup() {
  HC12.begin(9600);
  Serial.begin(9600);

  DeviceID = EEPROM.read(DeviceIDAddress);

  Serial.print("DeviceID:");
  Serial.println(DeviceID);

  setupValves();
  setupWireless();

  Serial.println("Booting Up");
}

void setupValves() {
  pinMode(MotorAIn1, OUTPUT);
  pinMode(MotorAIn2, OUTPUT);

  pinMode(MotorBIn1, OUTPUT);
  pinMode(MotorBIn2, OUTPUT);

  pinMode(MotorCIn1, OUTPUT);
  pinMode(MotorCIn2, OUTPUT);

  pinMode(MotorDIn1, OUTPUT);
  pinMode(MotorDIn2, OUTPUT);

  pinMode(MotorEIn1, OUTPUT);
  pinMode(MotorEIn2, OUTPUT);
}

void setupWireless() {
  HC12.begin(9600);
  pinMode(HC12Set, OUTPUT);
  digitalWrite(HC12Set, LOW);

  delay(100);
  HC12.println("AT+DEFAULT");
  delay(500);

  HC12.println("AT+C011");  
  delay(500);

  digitalWrite(HC12Set, HIGH);
}

////////////////// LOOP //////////////////

void loop() {
  if(HC12.available()) {
    char CommandByte = HC12.read();

    if(CommandByte == '|') {
      rawCommand.trim();

      Serial.println(rawCommand);

      // if(rawCommand.length() != 3) {
      //   rawCommand = "";
      //   return;
      // }
      
      int DID = rawCommand.substring(0, 1).toInt();

      if(DID != DeviceID) {
        rawCommand = "";
        return;
      }

      sendOK();

      bool A = rawCommand.substring(1, 2) == "1";
      controlValve('A', A);

      bool B = rawCommand.substring(2, 3) == "1";
      controlValve('B', B);

      char C = false;
      if (rawCommand.length() >= 4) {
        bool C = rawCommand.substring(3, 4) == "1";
        controlValve('C', C);
      }

      bool D = false;
      if (rawCommand.length() >= 5) {
        bool D = rawCommand.substring(4, 5) == "1";
        controlValve('D', D);
      }

      bool E = false;
      if (rawCommand.length() >= 6) {
        bool E = rawCommand.substring(5, 6) == "1";
        controlValve('E', E);
      }

      bool F = false;
      if (rawCommand.length() >= 7) {
        bool F = rawCommand.substring(6, 7) == "1";
        controlValve('F', F);
      }

      rawCommand = "";

      pingCount++;
      if(pingCount >= 30) {
        pingCount = 0;
        Serial.println("Resetting..");
        resetFunc();
      }
    } else {
      rawCommand += CommandByte;
    }
  }
}

void controlValve(char motor, bool state) {
  if(motor == 'A' && state) {
    Serial.println("Opening Valve A");
    digitalWrite(MotorAIn1, HIGH);
    digitalWrite(MotorAIn2, LOW);
    ValveA = state;
  } else if(motor == 'A' && state == false) {
    Serial.println("Closing Valve A");
    digitalWrite(MotorAIn1, LOW);
    digitalWrite(MotorAIn2, HIGH);
    ValveA = state;

  } else if(motor == 'B' && state) {
    Serial.println("Opening Valve B");
    digitalWrite(MotorBIn1, HIGH);
    digitalWrite(MotorBIn2, LOW);
    ValveB = state;
  } else if(motor == 'B' && state == false) {
    Serial.println("Closing Valve B");
    digitalWrite(MotorBIn1, LOW);
    digitalWrite(MotorBIn2, HIGH);
    ValveB = state;

  } else if(motor == 'C' && state) {
    Serial.println("Opening Valve C");
    digitalWrite(MotorCIn1, HIGH);
    digitalWrite(MotorCIn2, LOW);
    ValveB = state;
  } else if(motor == 'C' && state == false) {
    Serial.println("Closing Valve C");
    digitalWrite(MotorCIn1, LOW);
    digitalWrite(MotorCIn2, HIGH);
    ValveB = state;

  } else if(motor == 'D' && state) {
    Serial.println("Opening Valve D");
    digitalWrite(MotorDIn1, HIGH);
    digitalWrite(MotorDIn2, LOW);
    ValveB = state;
  } else if(motor == 'D' && state == false) {
    Serial.println("Closing Valve D");
    digitalWrite(MotorDIn1, LOW);
    digitalWrite(MotorDIn2, HIGH);
    ValveB = state;

  } else if(motor == 'E' && state) {
    Serial.println("Opening Valve E");
    digitalWrite(MotorEIn1, HIGH);
    digitalWrite(MotorEIn2, LOW);
    ValveB = state;
  } else if(motor == 'E' && state == false) {
    Serial.println("Closing Valve E");
    digitalWrite(MotorEIn1, LOW);
    digitalWrite(MotorEIn2, HIGH);
    ValveB = state;

  } else {
    return;
  }

  delay(5000);

  digitalWrite(MotorAIn1, LOW);
  digitalWrite(MotorAIn2, LOW);
  digitalWrite(MotorBIn1, LOW);
  digitalWrite(MotorBIn2, LOW);
  digitalWrite(MotorCIn1, LOW);
  digitalWrite(MotorCIn2, LOW);
  digitalWrite(MotorDIn1, LOW);
  digitalWrite(MotorDIn2, LOW);
  digitalWrite(MotorEIn1, LOW);
  digitalWrite(MotorEIn2, LOW);
}

void sendOK() {
  HC12.print(String("DID=")+String(DeviceID)+String("&OK=1|"));

  digitalWrite(LED, HIGH);
  delay(100);
  digitalWrite(LED, LOW);
  delay(100);
  digitalWrite(LED, HIGH);
  delay(100);
  digitalWrite(LED, LOW);
}