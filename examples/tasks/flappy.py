import json,random,sys,time
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input


CANVAS_W = 490
CANVAS_H = 400
PIPE_BLOCKS = 8
PIPE_BLOCK_SIZE = CANVAS_H / PIPE_BLOCKS
FLAPPY_W = PIPE_BLOCK_SIZE
FLAPPY_H = PIPE_BLOCK_SIZE
FLAPPY_X = 100
SEC_TO_STEP = .005
STEPS_TO_ADD_PIPE = 250



def send(d): print(json.dumps(d)); sys.stdout.flush()
def recv(): return json.loads(input())


pipenums=[0,1,2,3,4,5,6,7]
def addPipe():
	pipenum=pipenums.pop()
	gap_y1=random.randrange(1,6)*PIPE_BLOCK_SIZE
	gap_y2=gap_y1+PIPE_BLOCK_SIZE * 2
	id="#pipe%d"%pipenum
	send({"#canvas":{
		id:{"_bx":dict(w=PIPE_BLOCK_SIZE,h=CANVAS_H,x=CANVAS_W,y=0),
			"#u":{"_bx":dict(w=PIPE_BLOCK_SIZE,h=gap_y1,x=0,y=0,bg='green')},
			"#d":{"_bx":dict(w=PIPE_BLOCK_SIZE,h=CANVAS_H-gap_y2,x=0,y=gap_y2,bg='green')}}}})
	return [pipenum,CANVAS_W,gap_y1]


def main():
	alive,score,y,step,pipes,removepipes=True,0,0,0,[],[]
	send({
		'_task':{'good':{'Score':'+'}},
		'Score':0})
	send({"#canvas":{
			"_bx":{"w":CANVAS_W,"h":CANVAS_H},
			"#flappy":{"_bx":dict(w=FLAPPY_W,h=FLAPPY_H,x=FLAPPY_X,y=y,bg='blue')}}})
	send({"#btn":["_i","flap"]})
	while alive:
		step+=1
		y+=1
		canvasUpdate={"#flappy":{"_bx":{"y":y}}}
		if step%STEPS_TO_ADD_PIPE==0:
			pipes.append(addPipe())
		for i in range(len(pipes)):
			pipe=pipes[i]
			pipe[1]-=1
			canvasUpdate["#pipe%d"%pipe[0]]={"_bx":{"x":pipe[1]}}
			if pipe[1]==FLAPPY_X+FLAPPY_W and (y<pipe[2] or y>pipe[2]+PIPE_BLOCK_SIZE):
				alive=False
			if pipe[1]==-PIPE_BLOCK_SIZE:
				pipenums.append(pipe[0])
				removepipes.append(i)
				score+=1
				send({'Score':score})
		while removepipes:
			del pipes[removepipes.pop()]
		send({"#canvas":canvasUpdate})
		send({"_W":{"a":SEC_TO_STEP}})
		r=recv()
		while "#btn" in r:
			y-=50
			r=recv()
		if y+FLAPPY_H>=CANVAS_H:
			alive=False
	send('Thank you. Goodbye.')


main()
