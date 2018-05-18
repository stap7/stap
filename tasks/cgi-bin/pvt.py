#!/usr/bin/env python3

'''Psychomotor Vigilance Task

Stateless CGI script (state is kept by passing a state string as a second parameter to the jsonp callback function; this will work with stapjs library).

Note that although this is task that is focused on millisecond-level timing, it can still be done as a standard CGI script;
reason being, that all of the timing functionality is client-side.
'''


import cgi; form = cgi.FieldStorage()
import json,random

TRIALS = 20


#read request parameters
callback = form.getvalue('callback') or form.getvalue('c')
state = form.getvalue('state') or form.getvalue('s')
try: state = json.loads(state)
except: state = {"trial":0}
data = form.getvalue('data') or form.getvalue('d')
try: time,element,value = json.loads(data)
except: time,element,value = 0,0,[0]


def obj(id=None,content=NotImplemented,**options):
	if id is not None: options['id']=id
	if content is not NotImplemented: options['v']=content
	return options


def send(stap,state=None):
	if callback:                           #return jsonp (based on callback in request)
		if state:
			print('%s(%s,%s);'%(callback,json.dumps(stap),json.dumps(state)))
		else:
			print('%s(%s);'%(callback,json.dumps(stap)))
	else:                                  #return legal json string
		print(json.dumps(stap))


def main():
	#print http header
	print("Content-type: text/plain\n")

	#initial task setup
	if element==0 and value==[0]:
		send({'require':{'options':['U','onedit']}})
		send([  obj('Trial',1,max=TRIALS),
				obj('Click a button when one appears',[],onedit=None)  ])

	#final task page
	if state['trial']==TRIALS:
		send(None)
		send([ 'Thank you for your participation.' ])
	
	#trial
	else:
		#display response time
		if element == 'Click me':
			send([ obj('Your response time is',time-state['show']) ])
		#next trial
		state['trial']+=1
		#pick random time for button to appear
		state['show']=time+random.randrange(3000,10000)
		#wait, then show the button
		send([
				obj('Trial',state['trial']), 
				obj('Click a button when one appears', [obj('Click me',False)],U=state['show']) 
			], state)

main()
