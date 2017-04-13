#!/usr/bin/env python3

'''Psychomotor Vigilance Task'''


#########################################################
# STAP constants and stdio
import json,sys

if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())

CLEAR = None
START_EDIT = 'S'
ON_EDIT = 'onedit'
RECEIPT = 'R'
RECEIPT_WHEN_CHANGING = 2
#########################################################


import random,statistics


TRIALS = 4
INSTRUCTIONS = 'Click a button when one appears'

def main():
	log=[]
	
	#wait for user software to announce readiness
	ums=recv()[0]
	#announce required options
	send({'require':{'options':[RECEIPT,START_EDIT,ON_EDIT]}})
	
	send([ ('Trial',1,{'<=':TRIALS}), (INSTRUCTIONS,[]) ])
	
	for trial in range(1,TRIALS+1):
		#wait, then show the button and send back receipt
		send([ ('Trial',trial),
			(INSTRUCTIONS, [['Click me']], {
				START_EDIT:ums+random.randrange(2000,10000),
				RECEIPT:RECEIPT_WHEN_CHANGING,
				ON_EDIT:CLEAR}) ])
		#get receipt
		receipttime=recv()[0]
		#get participant action
		ums=recv()[0]
		log.append(ums-receipttime)
		send([ ('Your response time is',log[-1],{'unit':'ms'}) ])

	#display goodbye message in popup
	send( CLEAR )
	send([ ('Your mean response time is',statistics.mean(log)),
		'Thank you for your participation.' ])


if __name__=='__main__': main()
