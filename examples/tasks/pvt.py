'''Psychomotor Vigilance Task'''

import json,sys,random
try: input = raw_input		#Fix for Python 2.x raw_input
except NameError: pass


def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())



TRIALS = 20



def main():
	send({'Click a button when one appears':''})
	
	waitTill=random.randrange(2000,10000)
	
	for trial in range(1,TRIALS+1):
		send({'_S':waitTill,'Click a button when one appears':['_ih','Click me'],'_R':0,'_Z':0})
		#get receipt
		receipttime=recv()[0]
		#get participant action
		ums=recv()[0]
		recv()
		send({'response time is':ums-receipttime,'Click a button when one appears':''})
		waitTill=ums+random.randrange(2000,10000)

	#display goodbye message in popup
	send({'_pp':['Thank you for your participation.']})


if __name__=='__main__': main()
