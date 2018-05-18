#!/usr/bin/env python3

"""Time estimation/continuity task."""


#########################################################
# STAP constants and stdio
import json,sys

if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())

def obj(id=None,content=NotImplemented,**options):
	if id is not None: options['id']=id
	if content is not NotImplemented: options['v']=content
	return options
#########################################################



import random


MAXTRIALS = 24

MINDELAY = 3
MAXDELAY = 8

BALLSIZE = 40
CANVASSIZE = 400
ENDZONEHEIGHT = 3 * BALLSIZE
GOALLINEHEIGHT = 2


def main():
	#wait for user software to announce readiness
	recv()
	#announce required options
	send({"require":{
		"options":["S","R","onedit","x","y","w","h","bg"]
		}})
	for trial in range(1,MAXTRIALS+1):
		delay=random.randrange(MINDELAY,MAXDELAY+1)
		send(None)
		send([
			obj('Instructions','Press the "Start Timer" button to start a timer. Press "Stop Timer" when you think the ball reaches the RED line.'),
			obj('Drop Time',delay,unit='sec'),
			obj('x',content=[
				obj("ball",title='',w=BALLSIZE,h=BALLSIZE,x=CANVASSIZE/2-BALLSIZE/2,y=0,r=BALLSIZE/2,bg='blue'),
				obj(w=CANVASSIZE,h=ENDZONEHEIGHT,x=0,y=CANVASSIZE-ENDZONEHEIGHT-GOALLINEHEIGHT,bg='blue'),
				obj(w=CANVASSIZE,h=GOALLINEHEIGHT,x=0,y=CANVASSIZE-GOALLINEHEIGHT,bg='red')
				],w=CANVASSIZE,h=CANVASSIZE),
			obj("Start Timer",False,onedit=None) ])
		recv() #wait for Start button press
		send({"$":"ball","S":delay,"R":1,"y":CANVASSIZE-GOALLINEHEIGHT-BALLSIZE})
		recv() #wait for ball to start moving (receipt R triggers recv())
		send([ obj("Stop Timer",False,onedit=None) ])
		recv() #wait for button press
		send(None)
		if trial<MAXTRIALS:
			send([ obj("Next Trial",False) ])
			recv()
	send(['Thank you for your participation.'])


main()
