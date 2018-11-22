#!/usr/bin/env python3

'''Psychomotor Vigilance Task

Stateless CGI script (state is kept by passing a state string as a second parameter to the jsonp callback function; this will work with stapjs library).

Note that although this is task that is focused on millisecond-level timing, it can still be done as a standard CGI script;
reason being, that all of the timing functionality is client-side.
'''


import sys,os,json,random

TRIALS = 20



def send(stap):
	print("Content-Type: application/json\nAccess-Control-Allow-Origin: *\n")
	print(json.dumps(stap))


def obj(id=None,content=NotImplemented,**options):
	if id is not None: options['id']=id
	if content is not NotImplemented: options['v']=content
	return options


def main():
	#read request
	try: time,id,val = json.loads(sys.stdin.buffer.read(int(os.environ['CONTENT_LENGTH'])).decode('utf-8'))
	except: time,id,val = 0,None,['onload']
	
	displayUpdates=[]
	display=obj(content=displayUpdates)
	
	if val==['onload']:
		#initial task setup
		display.update({'require':{'options':['U','onin']},'template':'[type="bin"]{min-height:6em}'})
		displayUpdates+=[
			obj('Trial',1,max=TRIALS), 
			obj('Click a button when one appears',[])
			]
		trial=0

	elif id and id.startswith('btn'):
		#read button id (which includes trial number and display timestamp)
		_,trial,displayTime=id.split()
		trial=int(trial)
		#display response time
		displayUpdates.append(obj('Your response time is',time-int(displayTime)))
	
	if trial==TRIALS:
		#final task page
		displayUpdates.append(obj('Click a button when one appears',None))
		displayUpdates.append('Thank you for your participation.')
	
	else:
		#next trial
		trial+=1
		#pick random time for button to appear
		displayTime=time+random.randrange(3000,10000)
		#wait, then show the button (button id includes trial number and time of display to enable stateless scripting)
		displayUpdates+=[
				obj('Trial',trial), 
				obj('Click a button when one appears', [obj('btn %d %d'%(trial,displayTime),False,title='Click me',onin={'v':None})],U=displayTime)
			]
	send(display)

main()
