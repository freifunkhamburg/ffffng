#!/usr/bin/env python2

import os
import sys

if len(sys.argv) != 2:
    print('usage: ' + sys.argv[0] + ' /path/to/peers')
    sys.exit(1)

peersDir = sys.argv[1]

def normalizeMac(mac):
    mac = mac.lower()
    normalized = ''

    n = 0

    for c in mac:
        if c != ':':
            if n > 0 and n % 2 == 0:
                normalized = normalized + ':'
            normalized = normalized + c
            n += 1

    return normalized

def toFilename(peer):
    filename = ''
    for field in ['name', 'mac', 'vpn', 'token', 'monitoring-token']:
        if peer.has_key(field):
            filename = filename + peer[field]
        filename = filename + '@'

    return filename[:-1]

for filename in os.listdir(peersDir):
    if len(filename) == 0 or filename[0] == '.':
        continue

    absFilename = peersDir + '/' + filename
    if os.path.isfile(absFilename):
        peerFile = open(absFilename, 'r')
        try:
            peerLines = peerFile.readlines()
            peer = {}
            mac  = None
            for line in peerLines:
                parts = line.split()

                if len(parts) > 0:
                    for i in range(0, 3 - len(parts)):
                        parts.append('')

                    if parts[1] == 'Knotenname:':
                        peer['name'] = parts[2].lower()
                    elif parts[1] == 'MAC:':
                        peer['mac'] = normalizeMac(parts[2])
                    elif parts[1] == 'Token:':
                        peer['token'] = parts[2].lower()
                    elif parts[1] == 'Monitoring-Token:':
                        peer['monitoring-token'] = parts[2].lower()
                    elif parts[0] == 'key':
                        peer['vpn'] = parts[1].split('"')[1].lower()

            newFilename = toFilename(peer)

            if filename != newFilename:
                os.rename(absFilename, peersDir + '/' + newFilename)

        except Exception as e:
            print('Error in %s, ignoring peer: %s' % (absFilename, e));
        finally:
            peerFile.close()

