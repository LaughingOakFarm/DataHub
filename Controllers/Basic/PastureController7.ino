/*

Controllers:
  - Every 60 seconds have each controller will send telimetry:
    - Temp
    - Humitidy
    - Motor States
    - Ping Count
    - Controller Char ID
  - Wait 2 seconds for a response
    - If the response is meant for this controller
    - Update motor states by opening or closing motors
    - Sleep for 60 seconds

Hub:
  - The Roof Hub will process and store this data
    - Return Desired Motor States
*/


// INCLUDES
#include <SoftwareSerial.h>
#include <EEPROM.h>
#include <Wire.h>
#include "SSD1306Ascii.h"
#include "SSD1306AsciiWire.h"
#include <DHT.h>

#define RotoryCLK 2
#define MotorAIn1 3
#define RotoryDT 4
#define MotorAIn2 5
#define MotorBIn1 6
#define RotorySW 7
#define DHTPIN 8
#define MotorBIn2 9
#define HC12RX 11
#define HC12TX 10
#define HC12Set 12
#define LED 13
#define TRANSDUCER A2
#define I2C_ADDRESS 0x3C
#define MotorCIn1 A0
#define MotorCIn2 A1

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define DHTTYPE DHT11
#define DISPLAY_TIMEOUT = 30000
#define SSD1306_DISPLAYOFF 0xAE
#define SSD1306_DISPLAYON 0xAF

SSD1306AsciiWire display;
DHT dht(DHTPIN, DHTTYPE);
SoftwareSerial HC12(HC12TX, HC12RX);

// KNOB VARS
byte currentStateCLK;
byte previousStateCLK;
float counter;
byte selection;

// DISPLAY VARS
bool updateDisplay = true;
bool buttonPressed = false;
bool forceRefresh = false;
long lastInteraction = 0;
long lastRefresh = 0;

// WIRELESS VARS
byte displayTimeout = 30;
int telimetryID = 0;
String telimetry;
unsigned long telimetryTimeout = 10000;
unsigned long lastTelimetryTime;
String rawCommand;

// MOTOR VARS
bool ValveA = false;
bool ValveB = false;
bool ValveC = false;

// DEVICE VARS
int DeviceID;
byte DeviceIDAddress = 10;

#define aref_voltage 1.1

bool debug = true;

float temperature = 0;
float humidity = 0;

void setup() {
  analogReference(INTERNAL);
  Serial.begin(115200);
  dht.begin();

  DeviceID = EEPROM.read(DeviceIDAddress);

  Serial.print("DeviceID:");
  Serial.println(DeviceID);

  setupValves();
  setupWireless();
  analogReference(DEFAULT);

  displayMessage("Booting Up", 0);

  lastTelimetryTime = millis();

  // temperature = dht.readTemperature(true);
  // humidity = dht.readHumidity();
}

void loop() {
  if(HC12.available()) {
    char CommandByte = HC12.read();
    // Serial.println(CommandByte);

    if(CommandByte == '|') {
      updateValves();
    } else {
      rawCommand += CommandByte;
    }
  }

  // if(timeToSendTelimetry()) {
  //   displayMessage("Sending Telimetry", 1);
  //   sendTelimetry();
  // }
}

