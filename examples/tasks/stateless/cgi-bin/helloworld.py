#!/usr/bin/env python3

import cgi; form = cgi.FieldStorage()
import json

def recv():
  return json.loads(form.getvalue('d')) if 'd' in form else [0,0]

def send(stap):
  print("Content-type: text/plain\n")
  print("recv(%s);"%json.dumps(stap))



if recv()[1]=='Press Me':
  send([ 'You pressed the button!' ])
else:
  send([ 'Hello World!', ['Press Me'] ])

