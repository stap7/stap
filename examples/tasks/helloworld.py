import json,sys

if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input
def send(d): print(json.dumps(d)); sys.stdout.flush()

#display text "Hello World!"
send( "Hello World!" )
#display two buttons
send( {"Click a button": ["_i","Button 1","Button 2"]} )
#wait for a click
input()
#clear display
send( None )
#add text "Goodbye."
send( "Goodbye." )
