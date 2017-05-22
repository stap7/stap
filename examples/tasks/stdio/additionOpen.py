#!/usr/bin/env python3

'''Simple addition task'''


#########################################################
# STAP constants and stdio
import json,sys,random

if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())
#########################################################


TRIALS = 20


def main():
	#wait for user software to announce readiness
	recv()
	#announce required option eN, and describe task
	send({
		'require':{'options':['eN']},			#let participant know that this task will use the eN option (eN toggles edit-ability of a numeric field)
		'task':{
			'end':[['Trial',TRIALS]],			#let participant know that the task will end when the field Trial reaches 20
			'good':[['#feedback','Correct']],	#let participant know to seek the #feedback:Correct state
			'bad':[['#feedback','Incorrect']],	#let participant know to avoid the #feedback:Incorrect state
		}
	})
	#start trials
	for trial in range(1,1+TRIALS):
		#pick random integers as addends
		x,y = random.randint(1,10),random.randint(1,10)
		#display trial number, addends, and the numeric input field
		send( [ ('Trial', trial),
				('Problem', [x, '+', y]),
				('Answer', 0, {'eN':1}) ] )
		#get participant answer
		userMsg = recv()
		#clear screen
		send( None )
		#display feedback and Next Trial button
		send( [ ('#feedback', 'Correct' if (x+y==userMsg[2]) else 'Incorrect'),
				['Next'] ] )
		#wait for participant to click the button
		recv()
		#clear screen
		send( None )
	#display goodbye message
	send(['Thank you for your participation.'])


if __name__=='__main__': main()
