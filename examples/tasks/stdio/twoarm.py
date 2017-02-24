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
random.shuffle(REWARDS)

def getReward(buttonNum):
	return int( random.random()<REWARDS[buttonNum] )


def main():
	recv()
	send({'task':{
		'end':[['Trial',TRIALS]],								#let participant know that the task will end when the title field Trial reaches its max
		'good':[['Reward',1]]									#let participant know that the goal of the task is to keep Reward as close to 1 as possible
	}})
	send([['Trial',0,{'<=':TRIALS}]])							#let participant know that Trial will be a number with a maximum value
	send([['Click a button',
		[["Button 1"],["Button 2"]],							#let participant know there are 2 buttons to click
		{'onsubedit':{'eB':0}}]])								#	and the buttons are disabled once any are clicked
	
	for trial in range(1,TRIALS+1):
		#update trial number
		send([['Trial',trial]])
		#get participant action
		ums,val,_=recv()
		buttonNum = 0 if val=='Button 1' else 1
		#display reward
		send([['Reward',getReward(buttonNum)]])
		#wait 0.5 seconds
		send({'S':ums+500,'R':2})
		recv()
		#remove reward and enable buttons
		send([['Reward',None],['Click a button',{'eB':1}]])

	#display goodbye message
	send([[True,None],'Thank you for your participation.'])


if __name__=='__main__': main()
