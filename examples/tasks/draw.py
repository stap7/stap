'''Draw'''

import json,random,sys
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

MOUSEUP=1
MOUSEDOWN=2
MOUSEMOVE=8

def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return next(iter(json.loads(input()).items()))


WIDTH = 400
HEIGHT = 300

instructions="Draw a smiley face"

send({instructions:{"_ln":{},"_bx":{'w':WIDTH,'h':HEIGHT,'bg':'white'},'_i+':[MOUSEDOWN,MOUSEUP,MOUSEMOVE]}})
send({'#done':['_i','Done']})
points=[]
pathnum=0
key=None
while key!='#done':
	key,val=recv()
	if key==instructions:
		e,x,y=val
		if points and e==MOUSEMOVE:
			points+=[x,y]
			send({instructions:{"#%d"%pathnum:points}})
		elif e==MOUSEDOWN:
			points=[x,y]
		elif e==MOUSEUP:
			points=[]
			pathnum+=1

send(None)
send('Goodbye.')

