'''Sugar Production Factory task (Berry & Broadbent, 1984)'''

import json,random,sys
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input
def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())


TRIALS = 100
PRODUCTION_START = 6
PRODUCTION_TARGET = 9
PRODUCTION_BOUNDS = 1,12
WORKER_BOUNDS = 1,12
RANDOM_BOUNDS = -1,1

def getProduction(workers,currentProduction):
	return max(PRODUCTION_BOUNDS[0],min(PRODUCTION_BOUNDS[1],workers*2 - currentProduction + random.randrange(RANDOM_BOUNDS[0],RANDOM_BOUNDS[1]+1)))


try:

	send({'_task':{
		'end':{'Day':TRIALS},									#let participant know that the task will end when the title field Trial reaches its max
		'good':{'Current Sugar Production':PRODUCTION_TARGET}	#let participant know that the goal of the task is to keep Reward as close to 1 as possible
	}})

	send({'Day':{'_nm':{'<=':TRIALS}}})							#let participant know that Trial will be a number with a maximum value
	send({'Current Sugar Production':{'_nm':{'=':PRODUCTION_START,'>=':PRODUCTION_BOUNDS[0],'<=':PRODUCTION_BOUNDS[1],'rnd':1,'unit':'kilotons of sugar'}}})
	send({'Workers':["_i"]+list(range(WORKER_BOUNDS[0],WORKER_BOUNDS[1]+1))})

	currentProduction=PRODUCTION_START
	for trial in range(1,TRIALS+1):
		#update trial number
		send({'Day':trial})
		#get participant action
		workers = int(next(iter(recv()['Workers'])))
		currentProduction=getProduction(workers,currentProduction)
		#display new production level (via animation)
		send({'Current Sugar Production':currentProduction,'_T':{'s':.5,'ease':2}})

	#display goodbye message in popup
	send({'_pp':['Thank you for your participation.']})

except Exception as e:
	send({'_error':str(e)})


