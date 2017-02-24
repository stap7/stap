'''Psychomotor Vigilance Task

stateless webhook for hook.io website
'''

import json,random


TRIALS = 20

CLEAR_ALL = (True,None)


userMsg = json.loads(Hook['params']['d']) if 'd' in Hook['params'] else [0,0]
state = json.loads(Hook['params']['s']) if 's' in Hook['params'] else {'trial':0}

def send(stap,state=None):
	print("state='%s';"%json.dumps(state))
	print("recv(%s);"%json.dumps(stap))

if userMsg[1]==[0]:
	send({'require':{'options':['S','oninput']}})
	send([ ['Trial',1,{'<=':TRIALS}], ['Click a button when one appears',[]] ])


if state['trial']==TRIALS:
	send([ CLEAR_ALL, 'Thank you for your participation.' ])
else:
	#display response time
	if userMsg[1]=='Click me':
		send([ ['Your response time is',userMsg[0]-state['wait']] ])
	#next trial
	state['trial']+=1
	#pick random wait time
	state['wait']=userMsg[0]+random.randrange(2000,10000)
	#wait, then show the button and send back receipt
	send([ ['Trial',state['trial']], ['Click a button when one appears', [['Click me']], {'S':state['wait'],'oninput':None}] ], state)

