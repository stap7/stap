////////////////////////////////////
// STAP Task Server
//	this script will serve an stdio task as a TCP and websocket server;
//	each new connection will spawn a new stdio task process
//
// TODO:
//  add option for playback service (with optional password)
//  add option for data selection (with optional password)
//	add (a better) mechanism for multi-player service
//	add mechanism for tcp-ws relay (for servers serving one but not the other)
//	add secure layer
//

var usage=`
This script serves stdio executables over TCP or WebSockets.
Each new connection to server will spawn a new stdio process, 
  and pipe socket-out to std-in, and std-out to socket-in.

Usage:
 `+process.argv[0]+' '+process.argv[1]+` stdioExec portSpec [logFolder]
   stdioExec                    stdio executable and parameters
                                (surround stdioExec with quotes if excutable
                                requires dashed parameters, e.g. "foo.exe -a")
   portSpec:
     -t, --serveOnTCPPort port  serve stdioExec over TCP port
     -w, --serveOnWSPort port [-h,--html htmlpath]
                                serve stdioExec over WebSocket port,
                                [make html file at htmlpath (for STAP
                                WebSocket service)]
   logFolder:
     -l, --logpath path [-p, --playback htmlpath]
                                log all server-client interactions in
                                separate logfiles in the specified path folder
                                [make html file at htmlpath for playback]
`;


var childProcess = require('child_process'),
	WebSocket = require('ws'),
	CreateTcpServer=require('net').createServer,
	argParser=require('minimist'),
	fs=require('fs'),
	path=require('path');

var WIN=process.env.comspec && process.env.comspec.search("cmd.exe")>-1,
	spawnedProcesses=[],
	filesToRemove=[],
	playbackStartedOnPort=false;



////////////////////////////////////////
String.prototype.replaceAll=function(s1,s2){return this.replace(new RegExp(s1, 'g'), s2);}

function exeExists(exe){
	var p;
	if(WIN)p=childProcess.spawnSync(process.env.comspec,['/c'].concat(['where',exe]));
	else p=childProcess.spawnSync('which',[exe]);
	return p.status===0;
}

function mkdir(pathname) {
	try {fs.mkdirSync(pathname);}
	catch(e){if(e.code!='EEXIST')throw e;}
}

function newFilePath(folder,extension){
	//TODO: make sure filepath doesnt exist
	return path.join(folder,(new Date()).toJSON().replaceAll(':','-')+'.'+extension);
}

function wait( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}

function run(cmd){
	var p;
	console.log('starting',cmd);
	if(WIN)p=childProcess.spawn(process.env.comspec,['/c'].concat(cmd));
	else p=childProcess.spawn(cmd[0],cmd.slice(1));
	spawnedProcesses.push(p);
	p.runline=cmd;
	return p;
}

function killSpawnedProcess(p){
	console.log('killing aborted process ['+p.runline+']');
	spawnedProcesses.splice(spawnedProcesses.indexOf(p), 1);
	if(WIN)childProcess.spawn("taskkill", ["/pid", p.pid, '/f', '/t']);
	else p.kill();
}

function killSpawnedProcesses(){
	for(var i=0;i<spawnedProcesses.length;i++){
		//console.log(spawnedProcesses[i]);
		spawnedProcesses[i].kill();
	}
}

function exitHandler(options, err) {
	killSpawnedProcesses();
	while(filesToRemove.length)
		fs.unlinkSync(filesToRemove.pop());
    //if (options.cleanup) console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}
//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Node NOT Exiting...");
});


////////////////////////////////////////
function record2log(logfile,data,originIsActor){
	//if(logfile)logfile.write(data+'\r\n');
	if(logfile)logfile.write((new Date()).getTime()+'\t'+originIsActor+'\t'+data+'\r\n');
}
function onTask2ActorMsg(data,socket,tasklog){
	var arrayOfLines = data.toString().match(/[^\r\n]+/g);
	if(arrayOfLines){
		for(var i=0;i<arrayOfLines.length;i++){
			arrayOfLines[i]=arrayOfLines[i].trim();
			if(arrayOfLines[i].length){
				try{
					if(socket.write)socket.write(arrayOfLines[i]+'\r\n');
					else socket.send(arrayOfLines[i]+'\r\n');
					record2log(tasklog,arrayOfLines[i],0);
				}catch(e){
					console.log('!Failed to write to socket:\n',' > ',arrayOfLines[i],'\n',e,'\nClosing connection...');
					if(socket.end)socket.end();else socket.close();
					console.log('Closed.');
				}
			}
		}
	}
}
function onActor2TaskMsg(data,taskprocess,tasklog){
	try{
		data=data.toString().trim();
		if(data.length){
			taskprocess.stdin.write(data+'\r\n');
			record2log(tasklog,data,1);
		}
	}catch(e){
		console.log(e);
	}
}
function onActorConnection(task,socket,rcvEvent,endEvent){
	try{
		var tasklog;
		if(task.logpath){
			tasklog=fs.createWriteStream(newFilePath(task.logpath,'txt'));
			//logfile.write('Time\tActor\tData\r\n');
		}
		console.log((socket.remoteAddress || socket._socket.remoteAddress)+' connected.');
		var taskprocess=run(task._);
		taskprocess.stdout.on("data", function(data){onTask2ActorMsg(data,socket,tasklog);});	// task --> actor
		taskprocess.stderr.on("data", function(data){
			console.error("------- Error in \""+task._+"\"\n"+data.toString()+"\n=======");
			killSpawnedProcess(taskprocess);
			socket.close();
			if(tasklog)tasklog.end();
		});
		socket.on('error', function(err){
			console.log(err,'Closing connection...');
			if(socket.end)socket.end();else socket.close();
			killSpawnedProcess(taskprocess);
			if(task.logpath)tasklog.end();
			console.log('Closed.');
		});
		socket.on(rcvEvent, function(data){onActor2TaskMsg(data,taskprocess,tasklog);});		// actor --> task
		socket.on(endEvent, function(){killSpawnedProcess(taskprocess);if(task.logpath)tasklog.end();});
		taskprocess.on("close", function(){if(socket.end)socket.end();else socket.close();if(task.logpath)tasklog.end();});
	}catch(e){
		console.log(e);
	}
}
function startTaskService(task){
	if(task.server && task.server.exe){
		var taskprocess = run(task.server.exe,task.server.exeParams);
		taskprocess.stderr.on("data", function(data){
			console.error("------- Error in \""+task._+"\"\n"+data.toString()+"\n=======");
			killSpawnedProcess(taskprocess);
			socket.close();
			if(tasklog)tasklog.end();
		});
	}
	if(task.logpath){
		mkdir(task.logpath);
		if(task.playback){
			startPlaybackService(task.playback,(task.t || task.w)+2000,task.logpath);
		}
	}
	//Serve task over standard TCP Socket
	if(task.serveOnTCPPort){
		task.tcps = CreateTcpServer(function(socket){onActorConnection(task,socket,'data','end')}).listen(task.serveOnTCPPort);
	}
	//Serve task over WebSocket
	if(task.serveOnWSPort){
		task.wss = new WebSocket.Server({port: task.serveOnWSPort});
		task.wss.on('connection', function(socket){
			onActorConnection(task,socket,'message','close')
		});
		task.wss.on('listening',function(){
			if(task.html)makeHtmlStapClient(task.html,task.serveOnWSPort);
		});
	}
}



////////////////////////////////////////
function makeHtmlStapClient(filepath,port){
	var indexPage=fs.createWriteStream(filepath);
	indexPage.write(`<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
		<meta name="apple-mobile-web-app-capable" content="yes">
		<meta name="mobile-web-app-capable" content="yes">
		<html><head>
		<script src="lib/stap.js"></script>
		<script>PORT=`+port+`</script>
		</head><body /></html>`);
	indexPage.end();
	filesToRemove.push(filepath);
}

function startPlaybackService(playbackHTML,port,taskpath){
	var wss = new WebSocket.Server({port: port});
	console.log('trying playback on ',port);
	wss.on('error',function(){
		startPlaybackService(playbackHTML,port+1,taskpath);
	});
	wss.on('connection', function(ws){
		var logpath,timestamp,linenum,lines=[];
		makeHtmlStapClient(playbackHTML,port);
		ws.on('message', function(msg){
			console.log(msg);
			data=JSON.parse(msg);
			if(data['#logfiles']){
				if(!logpath){
					var logfile=Object.keys(data['#logfiles'])[0];
					logpath=path.join(taskpath,logfile);
					ws.send(JSON.stringify(null));
				}
				// var logfile=fs.createReadStream(logpath);
				// readLines(logfile,function(data){
					// ws.send(data);
					// setTimeout(logfile.resume,500);
				// });
				fs.readFile(logpath, 'utf8', function (err,data) {
					if(err)return console.log(err);
					lines=data.split('\n');
					linenum=0;
					function nextLine(line){
						try{
							console.log(line);
							var curtime;
							if(line[1]=='1'){
								ws.send('{"_.":'+line[2]+'}');
							}else{
								ws.send(line[2]);
							}
							while((linenum+1)<lines.length && lines[linenum+1].trim()==""){
								++linenum;
							}
							if((++linenum)<lines.length){
								var nextln=lines[linenum].split('\t');
								nextln[0]=parseInt(nextln[0]);
								if(nextln[1]=='1')nextln[0]=Math.max(line[0],nextln[0]-250);
								setTimeout(function(){nextLine(nextln);},
									Math.max(0,nextln[0]-line[0]));
							}else{
								ws.close();
							}
						}catch(e){
							taskpath=undefined;
							ws.close();
							console.log(e);
						}
					}
					var line=lines[linenum].split('\t');
					line[0]=parseInt(line[0]);
					nextLine(line);
				});
			}
		});
		ws.on('close', function(){linenum=lines.length;});
		ws.on('error', function(){linenum=lines.length;});
		ws.send("Logfile Playback");
		ws.send(taskpath);
		ws.send(JSON.stringify({'#logfiles':['_i'].concat(fs.readdirSync(taskpath))}));
	});
}



////////////////////////////////////////
function main(){
	var args=argParser(process.argv.slice(2),{
			alias:{
				w:'serveOnWSPort',
				t:'serveOnTCPPort',
				l:'logpath',
				h:'html',
				p:'playback'
			},
		});
	if(args._.length===1)args._=args._[0].split(" ");
	if(args.help || !args._.length)
		console.log(usage);
	else if(!exeExists(args._[0]))
		console.log(args._[0]+' is not a recognized command.\n Use --help for usage.');
	else if(!args.w && !args.t)
		console.log('Must specify either the TCP or the WebSocket port or both.\n Use --help for usage.');
	else if(args.h && !args.w)
		console.log('Must specify the WebSocket port if you use the -h,--html option to create a WebSocket client HTML page.\n Use --help for usage.');
	else if(args.p && !args.l)
		console.log('If you are creating a webpage for playback, you must also use the -l,--logpath option to specify a path for logfiles.');
	else
		startTaskService(args);
}

main();
