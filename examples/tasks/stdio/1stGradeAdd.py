#!/usr/bin/env python3

'''Simple addition task'''


#########################################################
# STAP constants and stdio
import json,sys,random

if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())

def Button(s): return [ str(s) ]
#########################################################


TRIALS = 10


def main():
	#wait for user software to announce readiness
	recv()
	send({
		'task':{
			'end':[['Trial',TRIALS]],			#let participant know that the task will end when the field Trial reaches 20
			'good':[['#feedback','Correct']],	#let participant know to seek the #feedback:Correct state
			'bad':[['#feedback','Incorrect']],	#let participant know to avoid the #feedback:Incorrect state
		}
	})
	#start trials
	for trial in range(1,1+TRIALS):
		#pick random integers as addends
		x,y = random.randint(5,10),random.randint(1,10)
		#set up multiple choice
		answers = [x+y]
		for i in range(random.randrange(4)):
			answers.insert(0,answers[0]-random.randint(1,2))
		for i in range(len(answers),4):
			answers.append(answers[-1]+random.randint(1,2))
		#display trial number, addends, and the numeric input field
		send( [ ('Trial', trial),
				('Problem', [x, '+', y]),
				('Answers', [Button(x) for x in answers]) ] )
		#get participant answer
		time,button,value = recv()
		#clear screen
		send( None )
		#display feedback and Next button
		send( [ 'Correct' if (str(x+y)==button) else 'Incorrect',
				['Next'] ] )
		#wait for participant to click the button
		recv()
		#clear screen
		send( None )
	#display goodbye message
	send(['Thank you for your participation.'])


if __name__=='__main__': main()
