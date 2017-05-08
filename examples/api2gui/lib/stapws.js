
var PARAMS={};location.search.substr(1).split("&").forEach(function(a){var b=a.split("=");PARAMS[b[0]]=b[1]});
var PORT=PARAMS['p'] || location.port; if(PORT)PORT=':'+PORT;
var HOST=PARAMS['h'] || location.hostname || "localhost";
var LOC=PARAMS['l'];

var ws;

function send(msg){
	console.log('<- '+msg);
	ws.send(msg);
}

function recv(msg){
	console.log('-> '+msg.data);
	processData(JSON.parse(msg.data));
}

function connect(){
	processData('Loading...');
	if("WebSocket" in window){
		if(!LOC.startsWith('ws://') && !LOC.startsWith('wss://'))
			LOC='ws://'+HOST+PORT+(LOC.startsWith('/')?LOC:('/'+LOC));
		ws=new window.WebSocket(LOC);
		ws.onerror=function(e){processData(null);processData({'error':'Cannot establish connection to ws://'+HOST+':'+PORT});};
		ws.onopen=onTaskConnect;
		ws.onclose=function (event) {
			var reason;
			// See http://tools.ietf.org/html/rfc6455#section-7.4.1
			if (event.code == 1000)
				reason = "";
			else if(event.code == 1001)
				reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
			else if(event.code == 1002)
				reason = "An endpoint is terminating the connection due to a protocol error";
			else if(event.code == 1003)
				reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
			else if(event.code == 1004)
				reason = "Reserved. The specific meaning might be defined in the future.";
			else if(event.code == 1005)
				reason = "No status code was actually present.";
			else if(event.code == 1006)
			   reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
			else if(event.code == 1007)
				reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
			else if(event.code == 1008)
				reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
			else if(event.code == 1009)
			   reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
			else if(event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
				reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
			else if(event.code == 1011)
				reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
			else if(event.code == 1015)
				reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
			else
				reason = "Unknown reason";
			console.log('Connection closed. '+reason);
			//processData({'error':'Connection closed. '+reason});
			//processData(['Connection closed.']);
		};
		ws.onmessage=recv;//function(e){recv(e.data);};
	}else{
		processData(null);
		processData([['Error','Your browser does not support websockets. Please use a modern browser to run this application.']]);
	}
}

