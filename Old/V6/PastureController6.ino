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
#define HC12RX 10
#define HC12TX 11
#define HC12Set 12
#define LED 13
#define V5 A7
#define TRANSDUCER A0
#define I2C_ADDRESS 0x3C

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define DHTTYPE DHT11
#define DISPLAY_TIMEOUT = 30000
#define SSD1306_DISPLAYOFF 0xAE
#define SSD1306_DISPLAYON 0xAF

SSD1306AsciiWire display;
DHT dht(DHTPIN, DHTTYPE);
SoftwareSerial HC12(HC12TX, HC12RX);

byte currentStateCLK;
byte previousStateCLK;
float counter;
byte selection;

bool updateDisplay = true;
bool buttonPressed = false;
bool forceRefresh = false;

long lastInteraction = 0;
long lastRefresh = 0;

byte displayTimeout = 30;
// int QueryID;
// String Query;

// struct Command {
//   char source; // w = wireless, s = serial
//   String rawCommand; 
//   String commandAction; // "Q", "C"
//   int deviceID; // 1-99
//   String controlID; // "A", "B"
//   String controlAction; // "O", "C"
// };

// struct Control {
//   String controlID;
//   String actionStatus;
// };

// Command command = {};
// Control controlA = {"A", "U"};
// Control controlB = {"B", "U"};

// int listenFor = 2000;
// int pingEvery = 15000;
// unsigned long lastPing = 0;
char DeviceID;
byte AnalogInputs = 0;
byte MotorCount = 0;
byte setupCount = 0;
byte DeviceIDAddress = 10;
byte AnalogInputAddress = 12;
byte MotorCountAddress = 13;

#define aref_voltage 1.1

void setup() {
  analogReference(INTERNAL);
  Serial.begin(115200);
  dht.begin();

  pinMode(TRANSDUCER, INPUT);

  DeviceID = EEPROM.read(DeviceIDAddress);
  if(!DeviceID) {
    setupCount = 1;
  }
  AnalogInputs = EEPROM.read(AnalogInputAddress);
  MotorCount = EEPROM.read(MotorCountAddress);

  setupDisplay();
  setupValves();
  setupWireless();
  analogReference(DEFAULT);

  if(setupCount != 0) {
    setupLoop();
  }

  updateDisplay = true;
}

void(* resetFunc) (void) = 0; 

void loop() {  
  pullRotory();
  long ms = millis();
  delay(500);

  Serial.println(getPSI(analogRead(TRANSDUCER)));

  // Update display if there is activity or if it has been 500ms
  if((updateDisplay && ms > lastInteraction + 100) || (ms > lastRefresh + 2000) || forceRefresh) {
    forceRefresh = false;
    updateDisplay = false;
    lastRefresh = ms;

    displayHeader();
    updateSelection();

    buttonPressed = false;
  }

  if(selection == 3 && buttonPressed) {
    clearEEPROM();
    resetFunc();
  }

  // Turn off display if there is no activity. 
  if(ms > lastInteraction + (displayTimeout * 1000) ) {
    display.ssd1306WriteCmd(SSD1306_DISPLAYOFF);
  } else {
    display.ssd1306WriteCmd(SSD1306_DISPLAYON);
  }

  forceRefresh = false;
}

float getPSI(int RawADC) {
 float volt = RawADC * (aref_voltage/1023.0);
 float bar = ((2.1271 * volt) + 5.1075 ) * volt - 0.2561; // optimized
 float psi = bar * 14.7; 
 return psi;
}




