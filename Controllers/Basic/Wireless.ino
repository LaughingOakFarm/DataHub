void setupWireless() {
  HC12.begin(9600);
  pinMode(HC12Set, OUTPUT);

  digitalWrite(HC12Set, LOW);
  delay(500);
  HC12.println("AT+DEFAULT");
  delay(500);
  HC12.println("AT+C011");
  delay(500);
  digitalWrite(HC12Set, HIGH);

  HC12.flush();
}

bool timeToSendTelimetry() {
  if (millis() - lastTelimetryTime > telimetryTimeout) {
    return true;
  }

  return false;
}

void sendOK() {
  HC12.print(String("DID=")+String(DeviceID)+String("&OK=1"));
}

void sendTelimetry() {
  telimetryID++;

  telimetry += String("DID=")+String(DeviceID)+String("&");
  telimetry += String("TID=")+telimetryID+String("&");
  telimetry += String("H=")+String(humidity)+String("&");
  telimetry += String("T=")+String(temperature)+String("&");
  telimetry += String("A=")+String(ValveA)+String("&");
  telimetry += String("B=")+String(ValveB)+String("&");
  telimetry += String("C=")+String(ValveC);

  telimetry += String("|");

  if(debug) {
    Serial.print("Telimetry: ");
    Serial.println(telimetry); 
  }

  HC12.print(telimetry);

  digitalWrite(LED, HIGH);
  delay(200);
  digitalWrite(LED, LOW);

  lastTelimetryTime = millis();
  telimetry = String();
}

void updateValves() {
  rawCommand.trim();

  if(rawCommand.length() != 4) {
    displayMessage(String("Response Rejected: ")+String(rawCommand), 2);
    rawCommand = "";
    return;
  }
  
  int DID = rawCommand.substring(0, 1).toInt();
  bool A = rawCommand.substring(1, 2) == "1";
  bool B = rawCommand.substring(2, 3) == "1";
  bool C = rawCommand.substring(3, 4) == "1";

  if(DID != DeviceID) {
    displayMessage(String("Ignoring Message: ")+String(rawCommand), 2);
    rawCommand = "";
    return;
  }

  sendOK();

  digitalWrite(LED, HIGH);
  delay(100);
  digitalWrite(LED, LOW);
  delay(100);
  digitalWrite(LED, HIGH);
  delay(100);
  digitalWrite(LED, LOW);

  displayMessage("Command: '"+String(rawCommand)+String("'"), 2);

  //Serial.println(String(A)+String(" != ")+String(ValveA));
  if(A != ValveA) {
    controlValve('A', A);
  }
  
  //Serial.println(String(B)+String(" != ")+String(ValveB));
  if(B != ValveB) {
    controlValve('B', B);
  }
  
  //Serial.println(String(C)+String(" != ")+String(ValveC));
  if(C != ValveC) {
    controlValve('C', C);
  }

  rawCommand = "";
}
