#!/usr/bin/env python3

'''Simple two-choice task with probabilistic rewards.'''


#########################################################
# STAP constants and stdio
import json,sys

if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())
#########################################################



import random


TRIALS = 20
REWARDS = [.7,.3]


def getReward(buttonNum):
	return int( random.random()<REWARDS[buttonNum] )


def main():
	#wait for user sw to announce readiness
	recv()
	#describe task
	send({'task':{
			'end':[['Trial',TRIALS]],		#let participant know that the task will end when the field Trial reaches 20
			'good':[['Reward',1]]			#let participant know that the goal of the task is to keep Reward as close to 1 as possible
	}})
	#randomly shuffle button rewards
	random.shuffle(REWARDS)
	#start trials
	for trial in range(1,TRIALS+1):
		#display trial number and two buttons
		send([	('Trial',trial),
				('Click a button',
					[["Button 1"],["Button 2"]] ) ])
		#get participant action
		buttonNum = 0 if recv()[1]=='Button 1' else 1
		#clear screen
		send(None)
		#display reward and Next Trial button
		send([ ('Reward',getReward(buttonNum)), ['Next Trial'] ])
		#wait for participant to click the button
		recv()
		#clear screen
		send(None)
	#display goodbye message
	send(['Thank you for your participation.'])


if __name__=='__main__': main()
