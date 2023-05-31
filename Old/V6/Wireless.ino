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
}

void wirelessLoop() {
  if ( millis() - lastPing > pingEvery) {
     lastPing = millis();   

     Serial.print("Listening...");
     while(millis() - lastPing < listenFor) {
      listenForCommand();
     }
     Serial.println("done");
  }

  Serial.println("sleepy time");
  delay(5000);
}

// bool listenForCommand() {
//   if(HC12.available()) {
//     char CommandByte = HC12.read();

//     if(CommandByte == '|') {
//       // Process the command
//       parseCommand();
//       command = {};
//       return true;
//     }
    
//     if(command.source == 'w' || !command.source) {
//       command.source = 'w';
//       command.rawCommand += CommandByte;
//     }
//   }

//   return false;
// }

// void parseCommand() {
//   command.rawCommand.trim();

//   if(command.rawCommand.length() != 5) {
//     command.rawCommand = "";
//     return;
//   }
  
//   command.commandAction = command.rawCommand.substring(0, 1);
//   command.deviceID      = command.rawCommand.substring(1, 3).toInt();
//   command.controlID     = command.rawCommand.substring(3, 4);
//   command.controlAction = command.rawCommand.substring(4, 5);
//   command.rawCommand = "";
// }

// void sendQueryResponse() {
//   QueryID++;

//   byte temperature = 0;
//   byte humidity = 0;
//   int err = SimpleDHTErrSuccess;
//   if ((err = dht11.read(&temperature, &humidity, NULL)) != SimpleDHTErrSuccess) {
//     Serial.print("Read DHT11 failed, err="); Serial.print(SimpleDHTErrCode(err));
//     Serial.print(","); Serial.println(SimpleDHTErrDuration(err));
//   }
  
//   Query += String("DID=")+DeviceID+String("&");
//   Query += String("QID=")+QueryID+String("&");
//   Query += String("H=")+String(humidity)+String("&");
//   Query += String("T=")+String(temperature)+String("&");
//   Query += String("A=")+String(controlA.actionStatus)+String("&");
//   Query += String("B=")+String(controlB.actionStatus)+String("&");

//   Query += String("|");
  
//   HC12.print(Query);

//   if(debug) {
//     Serial.print("Sent: ");
//     Serial.println(Query); 
//   }

//   Query = String();
// }
