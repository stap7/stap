import json,random,sys
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())

#instructions for what is considered positive and negative feedback
send( {
	"_task":{
		"good":{"#feedback":"Correct"},
		"bad":{"#feedback":"Incorrect"}
	}
} )

while 1:
	#make up a math problem
	x,y,answer=random.randrange(2,10),random.randrange(2,10),""
	#present the math problem to participant
	send( {"Add these numbers":[["#",x],["+",y]]} )
	send( {"Answer":["_ix"]} )
	send( {"#submit":["_i","Submit"]} )
	action=recv()
	#grab participant actions until the submit button to be clicked
	while action[1]!="#submit":
		#get participant's answer
		if action[1]=="Answer": answer=action[2].strip()
		action=recv()
	#clear the screen
	send( None )
	#send feedback
	send( {"#feedback": ("Correct" if answer==str(x+y) else "Incorrect") } )
	#in 1000ms send receipt msg
	send( {"_S":action[0]+1000,"_R":0} )
	#wait till receipt message comes back
	recv()
	#clear the screen
	send( None )


#####################################################################
# Sample interaction with participant:
# -> {"_task": {"good": {"#feedback": "Correct"}, "bad": {"#feedback": "Incorrect"}}}
# -> {"Add these numbers": [["#", 9], ["+", 9]]}
# -> {"Answer": ["_ix"]}
# -> {"#submit": ["_i", "Submit"]}
# <- [5340,"Answer","10"]
# <- [5388,"#submit",{"Submit":3}]
# -> null
# -> {"#feedback": "Incorrect"}
# -> {"_S": 6388, "_R": 0}
# <- [6389,"_R",8]
# -> null
# -> {"Add these numbers": [["#", 3], ["+", 9]]}
# -> {"Answer": ["_ix"]}
# -> {"#submit": ["_i", "Submit"]}
# <- [11326,"Answer","12"]
# <- [11394,"#submit",{"Submit":3}]
# -> null
# -> {"#feedback": "Correct"}
# -> {"_S": 12394, "_R": 0}
# <- [12395,"_R",15]
# -> null
# -> {"Add these numbers": [["#", 3], ["+", 3]]}
