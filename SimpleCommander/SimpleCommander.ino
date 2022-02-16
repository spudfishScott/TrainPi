
#define SIGNAL_ENABLE_PIN_MAIN 3
#define DIRECTION_MOTOR_CHANNEL_PIN_A 12

#define OUTBOUND_TRAIN_SENSOR 41
#define INBOUND_TRAIN_SENSOR 42

bool outbound = true;
  
void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);            // configure serial interface
  Serial.flush();

  pinMode(DIRECTION_MOTOR_CHANNEL_PIN_A, OUTPUT);
  digitalWrite(DIRECTION_MOTOR_CHANNEL_PIN_A, LOW); // Set direction to LOW (outbound)
  
  pinMode(SIGNAL_ENABLE_PIN_MAIN, OUTPUT);
  analogWrite(SIGNAL_ENABLE_PIN_MAIN, 0); // Set output PWM to 0
  
}

void loop() {
  // put your main code here, to run repeatedly:
  char c = 0;

  do {
    // check to see if the train is at the end of its run
    if ( (outbound && digitalRead(OUTBOUND_TRAIN_SENSOR) == LOW) || (!outbound && digitalRead(INBOUND_TRAIN_SENSOR) == LOW) ) {
      analogWrite(SIGNAL_ENABLE_PIN_MAIN, 0);   // stop
    }
  } while (Serial.available() == 0);

  c = Serial.read();

  if (c > 32) {
    switch(c) {
    case 'o': // direction outbound
      outbound = true;
      digitalWrite(DIRECTION_MOTOR_CHANNEL_PIN_A, LOW); // Set direction to LOW (outbound)
      analogWrite(SIGNAL_ENABLE_PIN_MAIN, 128); // full speed
      break;
    case 'i': // direction inbound
      outbound = false;
      digitalWrite(DIRECTION_MOTOR_CHANNEL_PIN_A, HIGH); // Set direction to HIGH (inbound)
      analogWrite(SIGNAL_ENABLE_PIN_MAIN, 128); // full speed
      break;
    }
  }
}

void status() {
   Serial.print("Outbound is ");
   Serial.println(outbound);
   Serial.print("Outbound sensor is ");
   Serial.println(digitalRead(OUTBOUND_TRAIN_SENSOR));
   Serial.print("Inbound sensor is ");
   Serial.println(digitalRead(INBOUND_TRAIN_SENSOR));
}
