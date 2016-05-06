#!/usr/bin/python

import sys
import os
import serial
import time
import platform
import websockets
import asyncio
import glob
<<<<<<< HEAD
=======
import signal
import functools
import concurrent
>>>>>>> 4ec7c2576f8edeb933eebd1bb28cc9ed119f3b8f
from tools import *
from serial.serialutil import SerialException
from serial.tools.list_ports import comports
from queue import Queue

async def transmit(websocket, path):
    while True:
        try:
            coords = coord_q.get(False)
        except queue.Empty:
            continue
        await websocket.send('{:.2f},{:.2f},{}\n'.format(coords.x, coords.y, time.time() * 1000))
        coord_q.task_done()


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

<<<<<<< HEAD
def main(argv):
=======
def get_msg():
    try:
        msg = ser.readline()
    except SerialException:
        sys.exit('Device disconnected. Exiting...')
    return msg

async def read_serial_async():
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        res = await loop.run_in_executor(executor, get_msg)
        return res.decode()



async def transmit(websocket, path):
    while True:
        try:
            while not work_q.empty():
                impact = await work_q.get()
                await websocket.send('{:.2f},{:.2f},{}\n'.format(impact.coords.x,
                                                                 impact.coords.y,
                                                                 impact.time))
        except websockets.exceptions.ConnectionClosed:
            work_q.put_nowait(coords)

async def produce():
    if len(sys.argv) > 1 and sys.argv[1] == '-g':
        gui = True
    else:
        gui = False

    while True:
        msg = await read_serial_async()
        if msg:
            times = [int(time) for time in msg.split()]
        else:
            times = None

        if times:
            p, c1, c2 = get_pcc(times)
            coords = find_target(p, c1, c2)
            impact = Impact(coords, time.time() * 1000)

            if coords:
                print('({:.2f}, {:.2f})'.format(coords.x, coords.y))
                if gui:
                    work_q.put_nowait(impact)

                if os.path.ismount('/mnt/usb'):
                    with open('/mnt/usb/data.csv', 'a') as f:
                        f.write('{:.2f},{:.2f},{}'.format(impact.coords.x, 
                                                          impact.coords.y, 
                                                          impact.time))
            else:
                print('Calculation aborted')


if __name__ == '__main__':
    # establish serial connection
>>>>>>> 4ec7c2576f8edeb933eebd1bb28cc9ed119f3b8f
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

<<<<<<< HEAD
    if len(argv) > 1 and argv[1] == '-g':
        gui = True
    else:
        gui = False
=======
    HOST = '127.0.0.1'
    PORT = 5001

    work_q = asyncio.Queue()
    loop = asyncio.get_event_loop()
    start_server = websockets.serve(transmit, HOST, PORT)
    asyncio.ensure_future(produce())
    asyncio.ensure_future(read_serial_async())
>>>>>>> 4ec7c2576f8edeb933eebd1bb28cc9ed119f3b8f

    if gui:
        coord_q = Queue()
        start_server = websockets.serve(transmit, '', 5001)
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()

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

                    if gui:
                        coord_q.put(coords, False)

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
