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
  display.clear();
  display.setFont(System5x7);

  display.setCursor(0, 0);
  // if(setupCount != 0) {
  //   display.println("Setup Controller");
  // } else {
    display.print("ID:");
    display.println(DeviceID);
  // }

  display.setCursor(0,8);
  display.print("Humidity:");
  // display.print((int) (h+0.5f));
  display.print("% Temp:");
  // display.println((int) (t+0.5f));

  display.setCursor(0, 16);
  display.println("---------------------");
}

void displayMessage(String message, int row) {
  Serial.println(message);

  // display.setFont(System5x7);
  // display.setCursor(0, row * 8);
  // display.println(message);
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


