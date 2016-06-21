'''Draw'''

import json,random
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

MOUSEUP=1
MOUSEDOWN=2
MOUSEMOVE=8

def send(d): print(json.dumps(d))
def recv(): return json.loads(input())
def recvVal(): return next(iter(recv().items()))[1]


WIDTH = 400
HEIGHT = 300

clickArea="Click on area below to draw"

send({clickArea:{"_ln":{},"_bx":{'w':WIDTH,'h':HEIGHT,'bg':'white'},'_i+':[MOUSEDOWN,MOUSEUP,MOUSEMOVE]}})
points=[]
pathnum=0
while True:
	e,x,y=recvVal()
	if points and e==MOUSEMOVE:
		points+=[x,y]
		send({clickArea:{"#%d"%pathnum:points}})
	elif e==MOUSEDOWN:
		points=[x,y]
	elif e==MOUSEUP:
		points=[]
		pathnum+=1

