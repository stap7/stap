function send(o,s){
  if(s!==undefined)response.body='state='+JSON.stringify(s)+';recv('+JSON.stringify(o)+')';
  else response.body = 'recv('+JSON.stringify(o)+')';
}

function recv(){
  if(request.params.d)return JSON.parse(request.params.d);
  return [];
}

function randInt(min, max){return Math.floor(Math.random()*(max-min+1))+min;}

if(request.params.s){
  send( [ ['',null],
          (request.params.s === (''+recv()[2]))?'Correct':'Incorrect', ['Next'] ],
          null );
}else{
  var x=randInt(1,10), y=randInt(1,10);
  send( [ ['',null], x, '+', y, ['Answer',0,{eN:1}] ], x+y );
}

