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

def terminate():
    sys.exit('\nexiting...')

def get_pcc(times):
    """Calculate a point and 2 circles for Apollonius algorithm"""
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


async def consume(websocket, path):
    if len(sys.argv) > 1 and sys.argv[1] == '-g':
        gui = True
    else:
        gui = False

    while True:
        try:
            await coords = coord_q.get()
        except asyncio.QueueEmpty:
            continue
        if gui:
            await websocket.send('{:.2f},{:.2f},{}\n'.format(coords.x, coords.y, time.time() * 1000))
        print('({:.2f}, {:.2f})'.format(coords.x, coords.y))

        if os.path.ismount('/mnt/usb'):
            with open('/mnt/usb/data.csv', 'a') as f:
                f.write(str(coords.x) + ',' + str(coords.y) + ',' + 
                        str(time.time() * 1000) + '\n')


async def produce():
    while True:
        try:
            msg = ser.readline().decode()
        except SerialException:
            sys.exit('Device disconnected. Exiting...')

        if msg:
            times = [int(time) for time in msg.split()]

            p, c1, c2 = get_pcc(times)
            coords = find_target(p, c1, c2)

            if coords:
                coord_q.put_nowait(coords)

            else:
                print('Calculation aborted')

if __name__ == '__main__':
    # establish serial connection
    if platform.system() == 'Linux':
        ports = glob.glob('/dev/tty[A-Za-z]*')
    else if platform.system() == 'Windows': 
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

    loop = asyncio.get_event_loop()

    coord_q = asyncio.Queue()
    start_server = websockets.serve(consume, '', 5001)
    asyncio.ensure_future(start_server)
    asyncio.ensure_future(produce())

    print('Listening on serial port. Ctrl-c to quit.')

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        loop.close()
        sys.exit('\nExiting...')
    finally:
        loop.close()

