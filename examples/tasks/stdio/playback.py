#!/usr/bin/env python3

'''STAP logfile replay'''


import json,sys,os,time
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input


VALID_EXTENSIONS = 'log','csv','tsv','txt','elf'



def sendraw(d): print(d); sys.stdout.flush()
def send(d): sendraw(json.dumps(d))
def recv(): return json.loads(input())


def playback(path):
	send(None)
	lasttime=None
	with open(path) as f:
		for line in f:
			try:
				t,c,s=line.strip().split('\t',2)
				t=int(t)
				if lasttime:
					time.sleep((t-lasttime)/1000.)
				lasttime=t
				if s=='-':
					#TODO: account for ftrl
					c=json.loads(c)
					if not isinstance(c[2],list): #make sure it's an edit, rather than event; TODO: replay events too
						send({'.':[c[1],c[2]]})
				elif c=='-':
					sendraw(s)
			except: pass

def main(logpath='.'):
	recv()
	logfiles=[]
	for dirname, dirnames, filenames in os.walk(logpath):
		for filename in filenames:
			if os.path.splitext(filename)[1][1:] in VALID_EXTENSIONS:
				path=os.path.join(dirname, filename)
				logfiles.append( [ '%s (%d)'% (path[len(logpath):], os.path.getsize(path)) ] )
	send(logfiles)
	playback( logpath+recv()[1].split()[0] )


if __name__=='__main__':
	main(sys.argv[1] if len(sys.argv)>1 else '.')
