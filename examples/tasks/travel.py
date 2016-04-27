'''Traveling Salesman Task

'''

import json,random
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input


def send(d): print(json.dumps(d))
def recv(): return json.loads(input())
def itemKey(d): return next(iter(d.items()))[0]


TRIALS = 10
NUMBER_OF_LOCATIONS = 10
SECONDS_PER_TRIAL = 60

MAXX = 400
MAXY = 300
LOCSIZE = 15
MINDIST = 22

offset=LOCSIZE
canvasWidth=offset*2+LOCSIZE+MAXX
canvasHeight=offset*2+LOCSIZE+MAXY

locationBoxInputs={}

def distance(p1,p2): return ((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)**.5

def makeLocs(numlocs=10):
	locations=[]
	while len(locations)<numlocs:
		mindist=0
		while mindist<MINDIST:
			newloc=[offset+random.randrange(MAXX),offset+random.randrange(MAXY)]
			mindist=1000
			for loc in locations:
				mindist=min(mindist,distance(newloc,loc))
		locations.append(newloc)
	return locations

def locNum2Key(locNum): return "#%d"%locNum
def locKey2Num(locKey): return int(locKey[1:])

def makeMap(locs):
	map={"_bx":dict(w=canvasWidth,h=canvasHeight,x=0,y=0),"_i":{}}
	for locNum,loc in enumerate(locs):
		map[locNum2Key(locNum)]={"_bx":dict(w=LOCSIZE,h=LOCSIZE,x=loc[0],y=loc[1],bd='solid 1px black',bg='white',r=LOCSIZE//2)}
	return map

def calcDist(chosenLocs,locations):
	if chosenLocs:
		totDist=0
		chosenLocs.append(chosenLocs[0])
		p1=locations[chosenLocs[0]]
		for loc in chosenLocs[1:]:
			p2=locations[loc]
			totDist+=distance(p1,p2)
			p1=p2
		return int(totDist)

def runTrial(locations,map):
	send(None)
	send({"Instructions":"""<li> Produce the shortest possible circuit that connects each cirlce on the map.
<li> Click a white circle to add it to the circuit.
<li> Click a blue circle to remove it from the circuit.</ul>"""})
	send({"Map":{"#path":{"_ln":{}}}})
	send({"Map":{"#btns":map,"_bx":dict(w=canvasWidth,h=canvasHeight,bd='solid 1px black')}})
	send({"Timer":{"_nm":{"rnd":1,"=":SECONDS_PER_TRIAL,">=":0,"<=":SECONDS_PER_TRIAL}}})
	send({"Timer":0,"_T":SECONDS_PER_TRIAL})
	send({"_W":{"Are you ready to submit your solution?":SECONDS_PER_TRIAL}})
	chosenLocs=[]
	points=[]
	action=recv()
	while "Are you ready to submit your solution?" not in action:
		locNum=locKey2Num(itemKey(action["#btns"]))
		try:
			chosenLocsIndx=chosenLocs.index(locNum)
			if len(chosenLocs)==len(locations):
				send({"Are you ready to submit your solution?":None})
			points=points[:2*chosenLocsIndx]
			for loc in chosenLocs[chosenLocsIndx:]:
				send({"Map":{"#btns":{locNum2Key(loc):{"_bx":{"bg":'white'}}}}})
			chosenLocs=chosenLocs[:chosenLocsIndx]
		except ValueError:
			chosenLocs.append(locNum)
			points+=locations[locNum]
			send({"Map":{"#btns":{locNum2Key(locNum):{"_bx":{"bg":'blue'}}}}})
			if len(chosenLocs)==len(locations):
				points+=points[:2]
				send({"Are you ready to submit your solution?":["_i","Submit Solution"]})
		send({"Map":{"#path":{"#1":[p+LOCSIZE//2 for p in points]}}})
		action=recv()
	#stap.clearWait('submitTimer')
	totDist=calcDist(list(chosenLocs),locations) if len(chosenLocs)==len(locations) else 10000
	send(None)
	send({"Length of your circuit":totDist})
	return totDist

def main(numlocs=NUMBER_OF_LOCATIONS):
	locations=makeLocs(numlocs)
	map=makeMap(locations)
	bestScore=10000
	for trial in range(1,1+TRIALS):
		bestScore=min(bestScore,runTrial(locations,map))
		send({"Your best circuit length":bestScore})
		if(trial<TRIALS):
			send({"#next":["_i","Next Trial"]})
			recv()
	send("Thank you for participating.")
	send("Goodbye.")

main(NUMBER_OF_LOCATIONS)
#main(3)

