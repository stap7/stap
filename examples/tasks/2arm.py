'''Simple two-choice task with probabilistic rewards.'''

import json,random,sys
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())


TRIALS = 10
REWARDS = [.7,.3]
random.shuffle(REWARDS)

def getReward(buttonNum):
	return int( random.random()<REWARDS[buttonNum] )


send({'_task':{
	'end':{'Trial':TRIALS},									#let participant know that the task will end when the title field Trial reaches its max
	'good':{'Reward':1}										#let participant know that the goal of the task is to keep Reward as close to 1 as possible
}})
send({'Trial':{'_nm':{'<=':TRIALS}}})						#let participant know that Trial will be a number with a maximum value
send({'Click a button':["_i","Button 1","Button 2"]})		#let participant know there are 2 buttons to click


for trial in range(1,TRIALS+1):
	#update trial number
	send({'Trial':trial})
	#get participant action
	buttonNum = 0 if ('Button 1' in recv()['Click a button']) else 1
	#display reward in popup
	send({'_pp':{'Reward':getReward(buttonNum)}})
	#wait 0.5 seconds
	send({'_W':{'#wait':.5}})
	recv()
	#close popup
	send({'_pp':None})

#display goodbye message in popup
send({'_pp':['Thank you for your participation.']})


