void setupValves() {
  pinMode(MotorAIn1, OUTPUT);
  pinMode(MotorAIn2, OUTPUT);
  pinMode(MotorBIn1, OUTPUT);
  pinMode(MotorBIn2, OUTPUT);
  pinMode(MotorCIn1, OUTPUT);
  pinMode(MotorCIn2, OUTPUT);
}

void controlValve(char motor, char state) {
  if(motor == 'A' && state) {
    displayMessage("Opening Valve A", 3);
    digitalWrite(MotorAIn1, HIGH);
    digitalWrite(MotorAIn2, LOW);
    ValveA = state;
  } else if(motor == 'A' && state == false) {
    displayMessage("Closing Valve A", 3);
    digitalWrite(MotorAIn1, LOW);
    digitalWrite(MotorAIn2, HIGH);
    ValveA = state;

  } else if(motor == 'B' && state) {
    displayMessage("Opening Valve B", 4);
    digitalWrite(MotorBIn1, HIGH);
    digitalWrite(MotorBIn2, LOW);
    ValveB = state;
  } else if(motor == 'B' && state == false) {
    displayMessage("Closing Valve B", 4);
    digitalWrite(MotorBIn1, LOW);
    digitalWrite(MotorBIn2, HIGH);
    ValveB = state;

  } else if(motor == 'C' && state) {
    displayMessage("Opening Valve C", 5);
    digitalWrite(MotorCIn1, HIGH);
    digitalWrite(MotorCIn2, LOW);
    ValveC = state;
  } else if(motor == 'C' && state == false) {
    displayMessage("Closing Valve C", 5);
    digitalWrite(MotorCIn1, LOW);
    digitalWrite(MotorCIn2, HIGH);
    ValveC = state;
  } else {
    return;
  }

  delay(10000);
}


