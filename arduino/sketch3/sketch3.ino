#define RECPERIOD 5000
#define QUIETTIME 2000000

#define MIN(X, Y) (((X) < (Y)) ? (X) : (Y))
#define MAX(X, Y) (((X) > (Y)) ? (X) : (Y))

typedef struct {
  unsigned long mic0;
  unsigned long mic1;
  unsigned long mic2;
} Sample;

Sample volatile sample;
long volatile wallTime;

void sendData(unsigned long a, unsigned long b, unsigned long c) {
  unsigned long min = MIN(a, MIN(b, c));
  Serial.print(a - min);
  Serial.print(" ");
  Serial.print(b - min);
  Serial.print(" ");
  Serial.print(c - min);
  Serial.println();
}

void mic0ISR() {
  unsigned long time = micros();
  if(time - sample.mic0 > RECPERIOD && time - wallTime > QUIETTIME) {
    sample.mic0 = time;
    //Serial.print(0);
    //Serial.print(":");
    //Serial.println(time);
  }
}

void mic1ISR() {
  unsigned long time = micros();
  if(time - sample.mic1 > RECPERIOD && time - wallTime > QUIETTIME) {
    sample.mic1 = time;
    //Serial.print(1);
    //Serial.print(":");
    //Serial.println(time);
  }
}

void mic2ISR() {
  unsigned long time = micros();
  if(time - sample.mic2 > RECPERIOD && time - wallTime > QUIETTIME) {
    sample.mic2 = time;
    //Serial.print(2);
    //Serial.print(":");
    //Serial.println(time);
  }
}

void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT);
  pinMode(3, INPUT);
  pinMode(21, INPUT);
  attachInterrupt(digitalPinToInterrupt(2), mic0ISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(3), mic1ISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(21), mic2ISR, CHANGE);
}

void loop() {
  unsigned long time = micros();
  unsigned long mic0 = sample.mic0, mic1 = sample.mic1, mic2 = sample.mic2;
  unsigned long min = MIN(MIN(mic0, mic1), mic2), max = MAX(MAX(mic0, mic1), mic2);
  if(min <= 0) {
    return;
  }
  if(max - min <= RECPERIOD) {
    wallTime = time;
    sample.mic0 = sample.mic1 = sample.mic2 = 0;
    sendData(mic0, mic1, mic2);
  }
}

