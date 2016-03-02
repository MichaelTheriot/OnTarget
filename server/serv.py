import socket
from tools import *

def main():
    HOST = ''
    PORT = 5050
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind((HOST, PORT))
    s.listen(1)
    conn, addr = s.accept()

    print('Connection from: ' + str(addr))

    while True:
        msg = conn.recv(1024)

        # TODO: implement format_msg to return a point and 2 circles
        p, c1, c2 = format_msg(msg)

        coords = find_target(p, c1, c2)

        with open('data.json', 'a') as f:
            f.write(coords + '\n')

        conn.sendall(1)

if __name__ == '__main__':
    main()
