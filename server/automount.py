import os
import time

while True:
    for root, dirs, files in os.walk('/dev'):
        for fname in files:
            if fname == 'sda1':
                if not os.path.ismount('/mnt/usb')
                    os.system('mount /dev/sda1 /mnt/usb')
    time.sleep(1)
