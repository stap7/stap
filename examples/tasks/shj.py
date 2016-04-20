import json, random
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input


##############################################################################
## Task Setup
MAXTRIALS=32
CONDITIONS=[ #response should be CATEGORY_NAMES[1]
	[(0,0,0),(0,0,1),(0,1,0),(0,1,1)],	#type I
	[(0,0,0),(0,0,1),(1,1,0),(1,1,1)],	#type II
	[(0,0,0),(0,0,1),(0,1,0),(1,0,0)],	#type IV
	[(0,0,0),(1,0,1),(1,1,0),(0,1,1)],	#type VI
]
CURRENT_CONDITION=random.choice(CONDITIONS)
DIM2VIS=[0,1,2]; random.shuffle(DIM2VIS)
VAL2VIS=[random.randrange(2),random.randrange(2),random.randrange(2)]
CATEGORY_NAMES=["Greeble","Groble"]; random.shuffle(CATEGORY_NAMES)
##############################################################################

def send(d): print(json.dumps(d))
def recv(): return json.loads(input())

def itemKey(d): return next(iter(d.items()))[0]

def checkCorrect(s,r): return (s in CURRENT_CONDITION) == CATEGORY_NAMES.index(r)

def stimulus(dimVals):
	#visual representation of the 3-feature stimulus
	vis=[(not dimVals[dim]) if VAL2VIS[dim] else dimVals[dim] for dim in DIM2VIS]
	return {"_bx":dict(w=20,h=20,bd='solid',bdw=10,pad=0,
		bg='black' if vis[0] else 'white',
		bdc=('red' if vis[1] else 'blue'),
		r=vis[2]*20)}

def main():
	#set the label categories_ to stand for the full string, "Is this object a Greeble or a Groble?"
	send({"_replace":{"OBJ":"Is this object a Greeble or a Groble?"}})
	#let participant know that the task will end when the title field Trial reaches its max
	send({"_task":{
		"good":{'#feedback':'Correct'},
		"bad":{'#feedback':'Incorrect'},
		"end":{'Trial':MAXTRIALS},
	}})
	#add trial number element
	send({"Trial":{"_nm":{"<=":MAXTRIALS}}})
	#add element where stimulus will be displayed
	send({"OBJ":""})
	#add category buttons
	send({"#btns":["_i"]+CATEGORY_NAMES})
	#loop through trials
	correctTrials=[]
	for trial in range(1,MAXTRIALS+1):
		#create random stimulus
		s=random.randrange(2),random.randrange(2),random.randrange(2)
		#set Trial field in title bar to current trial number
		send({"Trial":trial})
		#add the stimulus to the canvas
		send({"OBJ":stimulus(s)})
		#collect response
		response = itemKey(recv()["#btns"])
		#check if correct
		correctTrials.append(checkCorrect(s,response))
		#send reward
		send({"_pp":{'#feedback':'Correct' if correctTrials[-1] else 'Incorrect'}})
		send({"_W":{"wait":.5}})
		recv()
		send({"_pp":""})
	send(None)
	send('Thank you for your participation.')
	send({
		'Experiment Summary':{
			'Category Structure Type':['I','II','IV','VI'][CONDITIONS.index(CURRENT_CONDITION)],
			CATEGORY_NAMES[1]:[("#%d"%i,stimulus(s)) for i,s in enumerate(CURRENT_CONDITION)],
			'Score':[
				['First Half',sum(correctTrials[:(MAXTRIALS//2)])],
				['Second Half',sum(correctTrials[(MAXTRIALS//2):])]
			]
		}
	})

main()

