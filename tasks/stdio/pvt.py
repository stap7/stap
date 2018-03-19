#!/usr/bin/env python3

'''Psychomotor Vigilance Task'''


#########################################################
# STAP constants and stdio
import json,sys

if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())

DELETE = None
START_TIME = 'S'
ON_INPUT = 'onedit'
#########################################################


import random,statistics


TRIALS = 20
INSTRUCTIONS = '@Click a button when one appears here'
BUTTON = {'@Click Me':False}

def main():
	log=[]
	#wait for user software to announce readiness
	ums=recv()[0]
	#announce required options
	send({'require':{'options':[START_TIME,ON_INPUT]}})
	#display Trial and instructions containers; let user software know that any buttons inside the instructions container should be deleted once user-input (i.e. click) is detected
	send([ {'@Trial':1,'<=':TRIALS},
			{INSTRUCTIONS:[], ON_INPUT:DELETE} ])
	#do trials
	for trial in range(1,TRIALS+1):
		#set random time for button appearance
		buttonAppearanceTime=ums+random.randrange(2000,10000)
		#update trial time, wait till buttonAppearanceTime, then add the 'Click me' button
		send([ {'@Trial':trial},
			{INSTRUCTIONS: [BUTTON], START_TIME:buttonAppearanceTime} ])
		#get participant action
		ums=recv()[0]
		log.append(ums-buttonAppearanceTime)
		send([ {'@Your response time is':log[-1],'unit':'ms'} ])
	#display goodbye message in popup
	send(DELETE)
	send([ {'@Your mean response time is':statistics.mean(log)},
		'Thank you for your participation.' ])


if __name__=='__main__': main()
