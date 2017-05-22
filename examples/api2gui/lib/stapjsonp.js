//STAP message exchange via jsonp
//	current url must include a parameter "l" which specifies the url for the task;
//	the task url will include a parameter d, the value of which will be a STAP-compliant user message, e.g.:
//		http://taskServer/taskScript?d=<<STAPmsg>>
//	the task url must return executable javascript that includes a call to recv(msg),
//		where the parameter msg is a legal STAP task->actor message;
//		additionally, if the url task script is stateless,
//			the callback can include a change to state, e.g.:
//				state=1; recv([ "hello world" ]);
//          the value of state will be included as the s parameter in the next callback to task url, e.g.:
//				http://taskServer/taskScript?d=<<STAPmsg>>&s=1
//

var HEAD = document.getElementsByTagName('head')[0];
var LOC=location.params['l'];



function urlWithQuery(url){
	var i=url.indexOf('?');
	if(i===-1)return url+'?callback=recv&';
	if(i===url.length-1 || url.endsWith('&'))return url;
	return url+'&callback=recv&';
}

userAgent.action = function(data){
	var msg=JSON.stringify(data);
	console.log('<- '+msg);
	var s=document.createElement('script');
	s.src=LOC+'d='+encodeURIComponent(msg)+(typeof(state)==='undefined'?'':('&s='+encodeURIComponent(state)));
	HEAD.appendChild(s);
}

function recv(data){
	console.log('-> ',data);
	if(typeof(data)==='string'){		//redirect
		var url=new URL(data);
		LOC=urlWithQuery(url.origin+url.pathname);
		userAgent.onTaskConnect();
	}else{								//parse task message
		userAgent.update(data);
	}
}

function connect(){
	//if(!LOC.startsWith('http://') && !LOC.startsWith('https://'))
	//	LOC=location.protocol+'//'+HOST+PORT+(LOC.startsWith('/')?LOC:('/'+LOC));
	LOC=urlWithQuery(LOC);
	userAgent.onTaskConnect();
}

