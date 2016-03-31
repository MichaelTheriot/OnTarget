#!/usr/bin/python

import os
import serial
import time
from tools import *

def get_pcc(times):
    '''Calculate a point and 2 circles for Apollonius algorithm'''
    speed_of_sound = 0.00112533 # feet/microsecond
    mic_coords = (Point(1, 6), Point(0, 8), Point(-1, 6))
    first_mic = times.index(min(times))
    p = mic_coords[first_mic]
    diffs = [times[i] - times[first_mic] for i in range(3)]
    radii = [diffs[i] * speed_of_sound for i in range(3)]
    circles = []

    for i, r in enumerate(radii):
        if r:
            circles.append(Circle(mic_coords[i], r))

    return p, circles[0], circles[1]

def main():
    ser = serial.Serial('/dev/ttyACM0', 9600)
    times = [0, 0, 0]

    try:
        print('Listening on serial port. Ctrl-c to quit.')
        while True:
            msg = ser.readline().decode()
            if msg:
                times[int(msg[0])] = int(msg.split()[1])

                if 0 not in times: 
                    p, c1, c2 = get_pcc(times)
                    times = [0, 0, 0] # reset times for next calculation

                coords = find_target(p, c1, c2)

                print(coords.x, coords.y)

                if os.path.ismount('/mnt/usb'):
                    with open('/mnt/usb/data.csv', 'a') as f:
                        f.write(str(coords.x) + ',' + str(coords.y) + ',' + 
                                str(time.time() / 1000) + '\n')
                    
    except KeyboardInterrupt:
        print('exiting...')


if __name__ == '__main__':
    main()
