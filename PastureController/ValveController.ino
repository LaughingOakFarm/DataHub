void setupValves() {
  pinMode(MotorAIn1, OUTPUT);
  pinMode(MotorAIn2, OUTPUT);
  pinMode(MotorBIn1, OUTPUT);
  pinMode(MotorBIn2, OUTPUT);
  pinMode(V5, OUTPUT);

  digitalWrite(V5, HIGH);
}

void controlValve(char command, char motor) {
  if(motor == 'A' && command == 'O') {
    digitalWrite(MotorAIn1, HIGH);
    digitalWrite(MotorAIn2, LOW);
  } else if(motor == 'A' && command == 'C') {
    digitalWrite(MotorAIn1, LOW);
    digitalWrite(MotorAIn2, HIGH);

  } else if(motor == 'B' && command == 'O') {
    digitalWrite(MotorBIn1, HIGH);
    digitalWrite(MotorBIn2, LOW);
  } else if(motor == 'B' && command == 'C') {
    digitalWrite(MotorBIn1, LOW);
    digitalWrite(MotorBIn2, HIGH);
  }

  delay(10000);
}


