void setupDisplay() {
  display.begin(&Adafruit128x64, I2C_ADDRESS);

  pinMode(RotoryCLK,INPUT);
  pinMode(RotoryDT,INPUT);
  pinMode(RotorySW, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
  previousStateCLK = digitalRead(RotoryCLK);

  display.clear();
}

void displayHeader() {
  float t = dht.readTemperature(true);
  float h = dht.readHumidity();
  if (isnan(h) || isnan(t)) {
    displayError("DHT sensor error");
  }

  display.clear();
  display.setFont(System5x7);

  display.setCursor(0, 0);
  if(setupCount != 0) {
    display.println("Setup Controller");
  } else {
    display.print("ID:");
    display.print(DeviceID);
    display.println(" v2023.3");
  }

  display.setCursor(0,8);
  display.print("Humidity:");
  display.print((int) (h+0.5f));
  display.print("% Temp:");
  display.println((int) (t+0.5f));

  display.setCursor(0, 16);
  display.println("---------------------");
}

void displayError(String error) {
  display.clear();
  display.setFont(System5x7);

  display.setCursor(0,0);
  display.println("Error:");

  display.setCursor(0, 16);
  display.println(error);

  for(;;);
}

void pullRotory() {
  currentStateCLK = digitalRead(RotoryCLK); 
  if (currentStateCLK != previousStateCLK){ 
    updateDisplay = true;
    lastInteraction = millis();

     // If DT state is different than CLK state then counter is incremented (CW)
     if (digitalRead(RotoryDT) != currentStateCLK) {
       counter = counter + .5;
     } else {
       // If DT state is same as CLK state then counter is decremented (CCW)
       counter = counter - 0.5;
     }

     selection = (int) (counter+0.5f);
     previousStateCLK = currentStateCLK;
  }

  if (digitalRead(RotorySW) == LOW){
    delay(250);
    updateDisplay = true;
    buttonPressed = true;
    lastInteraction = millis();
  }
}

void setupLoop() {
  while (setupCount != 0) {
    pullRotory();

    if(setupCount == 4) { // exit
      setupCount = 0;
      updateDisplay = true;
    }

    if((updateDisplay && millis() > lastInteraction + 100) || forceRefresh) {
      forceRefresh = false;
      updateDisplay = false;

      displayHeader();

      if(setupCount == 3) { // set Motor Count
        limitSelection(0, 2);
        display.setCursor(0, 28);
        display.print("Motor Count: ");
        display.println(selection);

        if(buttonPressed) {
          EEPROM.write(MotorCountAddress, selection);
          MotorCount = selection;
          Serial.println(String("Set Motor Count to: ")+selection);
          setupCount++;
          counter = 0;
          selection = 0;
          forceRefresh = true;
        }
      } else if(setupCount == 2) { // set Analog
        limitSelection( 0, 4);
        display.setCursor(0, 28);
        display.print("Analog Inputs: ");
        display.println(selection);

        if(buttonPressed) {
          EEPROM.write(AnalogInputAddress, selection);
          AnalogInputs = selection;
          Serial.println(String("Set Analogs to: ")+selection);
          setupCount++;
          counter = 0;
          selection = 0;
          forceRefresh = true;
        }
      } else if(setupCount == 1) { // set ID
        display.setCursor(0, 28);
        display.print("Set Device ID: ");

        char ascii = getAsciiFromSelection();
        Serial.println(ascii);
        display.println(ascii);
        if(buttonPressed) {
          DeviceID = ascii;
          EEPROM.put(DeviceIDAddress, ascii);
          setupCount++;
          updateDisplay = true;
          counter = 0;
          selection = 0;
          forceRefresh = true;
        }
      }

      buttonPressed = false;
    }
  }
}

void updateSelection() {
  display.setCursor(0, 24);
  if(selection == 1) {
    display.print("> ");
  } else {
    display.print("  ");
  }
  display.println("Valve A: ? State");

  display.setCursor(0, 32);
  if(selection == 2) {
    display.print("> ");
  } else {
    display.print("  ");
  }
  display.println("Valve B: ? State");

  display.setCursor(0, 40);
  if(selection == 3) {
    display.print("> ");
  } else {
    display.print("  ");
  }
  display.println("Factory Reset");

  display.setCursor(0, 48);
  display.println("---------------------");

  display.setCursor(0, 56);
  display.print("Analogs: ");
  display.println(AnalogInputs);
}

char getAsciiFromSelection() {
  if(selection > 25 || selection < 0) {
    counter = 0;
    selection = 0;
  }
  return 65+selection;
}

void limitSelection(byte min, byte max) {
  if(selection < min) {
    selection = counter = min;
    return;   
  }
  
  if(selection > max) {
    selection = counter = max;
    return;
  }
}

void clearEEPROM() {
  for (int i = 0; i < EEPROM.length(); i++) {
    EEPROM.write(i, 0);
  }
}







