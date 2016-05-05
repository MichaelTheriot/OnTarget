#define RECPERIOD 5000
#define QUIETTIME 2000000

#define MIN(X, Y) (((X) < (Y)) ? (X) : (Y))
#define MAX(X, Y) (((X) > (Y)) ? (X) : (Y))

#define GET_MIC_ISR_NAME(n) mic ## n ## ISR
#define DECLARE_MIC_ISR(n); void GET_MIC_ISR_NAME(n)() { unsigned long time = micros(); if(time - times[n] > RECPERIOD && time - wallTime > QUIETTIME) { times[n] = time; } }
#define SETUP_MIC_ISR(mic, pin) pinMode(pin, INPUT); attachInterrupt(digitalPinToInterrupt(pin), GET_MIC_ISR_NAME(mic), CHANGE);

unsigned long volatile times[3];
unsigned long volatile wallTime;

void sendData(unsigned long samples[]) {
  int i;
  for(i = 0; i < 3; i++) {
    Serial.print(samples[i]);
    Serial.print(" ");
  }
  Serial.println();
}

DECLARE_MIC_ISR(0);
DECLARE_MIC_ISR(1);
DECLARE_MIC_ISR(2);

void setup() {
  Serial.begin(9600);
  SETUP_MIC_ISR(0, 2);
  SETUP_MIC_ISR(1, 3);
  SETUP_MIC_ISR(2, 21);
}

void loop() {
  unsigned long time = micros(),
    samples[3] = { times[0], times[1], times[2] },
    min = MIN(samples[0], MIN(samples[1], samples[2])),
    max = MAX(samples[0], MAX(samples[1], samples[2]));
  if(min && max - min <= RECPERIOD) {
    wallTime = time;
    times[0] = times[1] = times[2] = 0;
    sendData(samples);
  }
}

