#!/usr/bin/env python3

import sys,os,json


try: time,id,val=json.loads(sys.stdin.buffer.read(int(os.environ['CONTENT_LENGTH'])).decode('utf-8'))
except: time,id,val=0,0,[0]


def send(stap):
  print("Content-Type: application/json\nAccess-Control-Allow-Origin: *\n")
  print(json.dumps(stap))




if id=='Press Me':
  send([ 'You pressed the button!' ])
else:
  send([ 'Hello World!', {'id':'Press Me','v':False} ])

