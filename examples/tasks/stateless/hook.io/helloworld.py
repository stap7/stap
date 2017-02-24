import json

def recv():
  return json.loads(Hook['params']['d']) if 'd' in Hook['params'] else [0,0]

def send(stap):
  print("recv(%s)"%json.dumps(stap))



if recv()[1]=='Press Me':
  send([ 'You pressed the button!' ])
else:
  send([ 'Hello World!', ['Press Me'] ])

