#!/usr/bin/env python3

import sys,os,json


try: time,id,val=json.loads(sys.stdin.buffer.read(int(os.environ['CONTENT_LENGTH'])).decode('utf-8'))
except: time,id,val=0,0,[0]

print("Content-Type: application/json\nAccess-Control-Allow-Origin: *\n")



if id=='Press Me':
  print(json.dumps([ None, 'You pressed the button!' ]))
else:
  print(json.dumps([ 'Hello World!', {'id':'Press Me','v':False} ]))

