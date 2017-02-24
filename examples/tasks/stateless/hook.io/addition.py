import json,random

CLEAR_ALL = [True,None]

userMsg = json.loads(Hook['params']['d']) if 'd' in Hook['params'] else [0,0]
state = json.loads(Hook['params']['s']) if 's' in Hook['params'] else None

def send(stap,state=None):
	print('state=%s;'%json.dumps(state))
	print("recv(%s);"%json.dumps(stap))

if state:
	send( [ CLEAR_ALL,
			'Correct' if state==userMsg[2] else 'Incorrect',
			['Next'] ] )
else:
	x,y = random.randint(1,10),random.randint(1,10)
	send( [ CLEAR_ALL, x, '+', y, ['Answer',0,{'eN':1}] ], x+y )
