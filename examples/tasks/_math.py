#same as math.py but without the use of [], only {}

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
	send( {"Add these numbers":{"#":x}} )
	send( {"Add these numbers":{"+":y}} )
	send( {"Answer":{"_ix":{}}} )
	send( {"#submit":{"_i":{},"Submit":1}} )
	action=recv()
	#grab participant actions until the submit button to be clicked
	while "#submit" not in action:
		#get participant's answer
		if "Answer" in action: answer=action["Answer"].strip()
		action=recv()
	#clear the screen
	send( None )
	#send feedback
	send( {"#feedback": ("Correct" if answer==str(x+y) else "Incorrect") } )
	#tell participant sw to set a timer for 500ms and then respond
	send( {"_W":{"":1}} )
	#wait for participant sw to respond
	recv()
	#clear the screen
	send( None )


#####################################################################
# Sample interaction with participant:
# "->":{"_task":{"good":{"#feedback":"Correct"},"bad":{"#feedback":"Incorrect"}}}
# "->":{"Add these numbers":[["#",9],["+",9]]}
# "->":{"Answer":["_ix"]}
# "->":{"#submit":["_i","Submit"]}
# "<-":{"Answer":"10"}
# "<-":{"#submit":{"Submit":3}}
# "->":null
# "->":{"#feedback":"Incorrect"}
# "->":{"_W":{"":0.5}}
# "<-":{"":0}
# "->":null
# "->":{"Add these numbers":[["#",8],["+",2]]}
# "->":{"Answer":["_ix"]}
# "->":{"#submit":["_i","Submit"]}
# "<-":{"Answer":"10"}
# "<-":{"#submit":{"Submit":3}}
# "->":null
# "->":{"#feedback":"Correct"}
# "->":{"_W":{"":0.5}}
# "<-":{"":0}
# "->":null
# "->":{"Add these numbers":[["#",5],["+",7]]}
# "->":{"Answer":["_ix"]}
# "->":{"#submit":["_i","Submit"]}
# ...

