#!/usr/bin/env python3

import cgi; form = cgi.FieldStorage()
import json

callback = form.getvalue('callback') or form.getvalue('c')
data = form.getvalue('data') or form.getvalue('d')
if data: data=json.loads(data)


def send(stap):
  print("Content-type: text/plain\n")    #this header precedes content in http responses
  if callback:                           #return jsonp (based on callback in request)
    print('%s(%s);'%(callback,json.dumps(stap)))
  else:                                  #return legal json string
    print(json.dumps(stap))



if data and len(data)>1 and data[1]=='Press Me':
  send([ 'You pressed the button!' ])
else:
  send([ 'Hello World!', {'id':'Press Me','v':False} ])

