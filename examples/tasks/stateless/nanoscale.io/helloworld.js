//request.body -> POST body string
//request.rawQuery -> GET query string
//request.params -> all POST and GET key:val pairs
//request.query -> GET key:val pairs
//request.form -> POST key:val pairs

function send(o){
  response.body = 'recv('+JSON.stringify(o)+')';
}

function recv(){
  if(request.params.d)
    return JSON.parse(request.params.d);
  return [];
}

if(recv()[1]=="Press Me")
  send([ "You pressed the button!" ])
else
  send([ "Hello, World!", ["Press Me"] ]);
