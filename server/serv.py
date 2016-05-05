#!/usr/bin/python

import sys
import os
import serial
import time
import platform
import websockets
import asyncio
import glob
from tools import *
from serial.serialutil import SerialException
from serial.tools.list_ports import comports
from queue import Queue

def get_pcc(times):
    '''Calculate a point and 2 circles for Apollonius algorithm'''
    speed_of_sound = 0.00112533 # feet/microsecond
    mic_coords = (Point(0, 4), Point(2, 1), Point(-3, 2))
    first_mic = times.index(min(times))
    p = mic_coords[first_mic]
    diffs = [times[i] - times[first_mic] for i in range(3)]
    radii = [diffs[i] * speed_of_sound for i in range(3)]
    circles = []

    for i, r in enumerate(radii):
        if r:
            circles.append(Circle(mic_coords[i], r))

    return p, circles[0], circles[1]

def main(argv):
    if platform.system() == 'Linux':
        ports = glob.glob('/dev/tty[A-Za-z]*')
    elif platform.system() == 'Windows': 
        ports = ['COM{}'.format(i + 1) for i in range(256)]
    else:
        sys.exit('Unsupported platform')

    ser = None
    for port in ports:
        try:
            ser = serial.Serial(port, 9600)
            break
        except (OSError, SerialException):
            pass

    if not ser:
        sys.exit('Serial connection failed.')

    try:
        print('Listening on serial port. Ctrl-c to quit.')
        while True:
            try:
                msg = ser.readline().decode()
            except SerialException:
                print('Device disconnected. Exiting...')
                sys.exit()

            if msg:
                times = [int(time) for time in msg.split()]

                p, c1, c2 = get_pcc(times)
                coords = find_target(p, c1, c2)

                if coords:
                    print('({:.2f}, {:.2f})'.format(coords.x, coords.y))

                    if os.path.ismount('/mnt/usb'):
                        with open('/mnt/usb/data.csv', 'a') as f:
                            f.write(str(coords.x) + ',' + str(coords.y) + ',' + 
                                    str(time.time() * 1000) + '\n')
                else:
                    print('Calculation aborted')
                    
    except KeyboardInterrupt:
        print('\nexiting...')


if __name__ == '__main__':
    main(sys.argv)
