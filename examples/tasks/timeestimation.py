import json,random,sys
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input


MAXTRIALS = 24

MINDELAY = 3
MAXDELAY = 8

BALLSIZE = 40
CANVASSIZE = 400
ENDZONEHEIGHT = 3 * BALLSIZE
GOALLINEHEIGHT = 2


def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())


def main():
	for trial in range(1,MAXTRIALS+1):
		delay=random.randrange(MINDELAY,MAXDELAY+1)
		send(None)
		send({'Instructions': 'Press the "Start Timer" button to start a timer. Press "Stop Timer" when you think the ball reaches the RED line.'})
		#send({'Drop Time (sec)':delay})
		send({"#canvas":{"_bx":{"w":CANVASSIZE,"h":CANVASSIZE}}})
		send({"#canvas":{"#ball":{"_bx":dict(w=BALLSIZE,h=BALLSIZE,x=CANVASSIZE/2-BALLSIZE/2,y=0,r=BALLSIZE/2,bg='blue')}}})
		send({"#canvas":{"#endzone":{"_bx":dict(w=CANVASSIZE,h=ENDZONEHEIGHT,x=0,y=CANVASSIZE-ENDZONEHEIGHT-GOALLINEHEIGHT,bg='blue')}}})
		send({"#canvas":{"#goalline":{"_bx":dict(w=CANVASSIZE,h=GOALLINEHEIGHT,x=0,y=CANVASSIZE-GOALLINEHEIGHT,bg='red')}}})
		send({"#btn":["_i","Start Timer"]})
		recv()
		send({"#canvas":{"#ball":{"_bx":{"_T":{"s":delay},"y":CANVASSIZE-GOALLINEHEIGHT-BALLSIZE}}}})
		send({"#btn":None})
		send({"#btn":["_i","Stop Timer"]})
		recv()
		send(None)
		if trial<MAXTRIALS:
			send({"#btn":["_i","Next Trial"]})
			recv()
	send('Thank you for your participation.')


main()
