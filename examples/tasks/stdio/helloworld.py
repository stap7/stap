#!/usr/bin/env python3

'''Hello world.'''


import json,sys
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())


#wait for user to send software to announce readiness
recv()

#add two items to user display: "Hello World!" string and a button "Press Me"
send([ 'Hello World!', ['Press Me'] ])
#wait for user to press the button
recv()
#clear screen
send(None)
#add "You pressed the button!" and 'Goodbye.' messages to user display
send([ 'You pressed the button!', 'Goodbye.' ])
