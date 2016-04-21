////////////////////////////////////
// STAP Task Server
//	this script will serve an stdio task as a TCP and websocket server;
//	each new connection will spawn a new stdio task process
//
// TODO:
//  make sure playback works (based on changes to STAP)
//	add (a better) mechanism for multi-player service
//	add mechanism for tcp-ws relay (for servers serving one but not the other)
//	add secure layer
//  add nicer listing interface for log files/playback
//

var spawn = require('child_process').spawn,
	WebSocket = require('ws'),
	CreateTcpServer=require('net').createServer,
	fs=require('fs'),
	path=require('path');
//	TASKS=require('stapTaskList.js').TASKS;

var DATADIR='data',
	PLAYBACKPORT=8701;
	WIN=process.env.comspec && process.env.comspec.search("cmd.exe")>-1,
	spawnedProcesses=[],
	TASKS=JSON.parse(fs.readFileSync('stapTaskList.json', 'utf8'));




////////////////////////////////////////
String.prototype.replaceAll=function(s1,s2){return this.replace(new RegExp(s1, 'g'), s2);}

/*function readLines(input, func) {
	var remaining = '';
	input.on('data', function(data) {
		remaining += data;
		var index = remaining.indexOf('\n');
		while (index > -1) {
			var line = remaining.substring(0, index);
			remaining = remaining.substring(index + 1);
			input.pause();
			func(line);
			index = remaining.indexOf('\n');
		}
	});
	input.on('end', function() {
		if (remaining.length > 0) {
			func(remaining);
		}
	});
}*/

function mkdir(pathname) {
	try {fs.mkdirSync(pathname);}
	catch(e){if(e.code!='EEXIST')throw e;}
}

function newFilePath(folder,extension){
	//TODO: make sure filepath doesnt exist
	return path.join(folder,(new Date()).toJSON().replaceAll(':','-')+'.'+extension);
}

function run(exe,exeParams){
	var p;
	console.log('starting',exe,exeParams);
	if(WIN)p=spawn(process.env.comspec,['/c'].concat(exe).concat(exeParams));
	else p=spawn(exe,exeParams);
	spawnedProcesses.push(p);
	p.runline=[exe].concat(exeParams);
	return p;
}

function killSpawnedProcess(p){
	console.log('killing aborted process ['+p.runline+']');
	spawnedProcesses.splice(spawnedProcesses.indexOf(p), 1);
	if(WIN)spawn("taskkill", ["/pid", p.pid, '/f', '/t']);
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
				if(socket.write)socket.write(arrayOfLines[i]+'\r\n');
				else socket.send(arrayOfLines[i]+'\r\n');
				record2log(tasklog,arrayOfLines[i],0);
			}
		}
	}
}
function onActor2TaskMsg(data,taskprocess,tasklog){
	data=data.toString().trim();
	if(data.length){
		taskprocess.stdin.write(data+'\r\n');
		record2log(tasklog,data,1);
	}
}
function onActorConnection(task,socket,rcvEvent,endEvent){
	try{
		var tasklog;
		if(task.log){
			tasklog=fs.createWriteStream(newFilePath(task.datapath,'txt'));
			//logfile.write('Time\tActor\tData\r\n');
		}
		console.log((socket.remoteAddress || socket._socket.remoteAddress)+' connected to '+task.desc);
		if(task.stdio){
			var taskprocess;
			taskprocess=run(task.stdio.exe,task.stdio.exeParams);
			taskprocess.stderr.on("data", function(data){
				console.error("------- Error in \""+task.stdio.exe+"\" ["+task.stdio.exeParams+"]\n"+data.toString()+"\n=======");
				killSpawnedProcess(taskprocess);
				socket.close();
				if(tasklog)tasklog.end();
			});
			taskprocess.stdout.on("data", function(data){onTask2ActorMsg(data,socket,tasklog);});	// task --> actor
			socket.on(rcvEvent, function(data){onActor2TaskMsg(data,taskprocess,tasklog);});		// actor --> task
			socket.on(endEvent, function(){killSpawnedProcess(taskprocess);tasklog.end();});
			taskprocess.on("close", function(){if(socket.end)socket.end();else socket.close();tasklog.end();});
		} else if(task.server.type=='ws'){
			var taskCon=new WebSocket(task.server.connectSpec);
			taskCon.on('message', function(data){onTask2ActorMsg(data,socket,tasklog);});			// task --> actor
			taskCon.on('error',function(e){console.log('ERROR: '+task.server.connectSpec+'\n'+e);});
			socket.on(rcvEvent, function(data){														// actor --> task
				try{
					data=data.toString().trim();
					if(data.length){
						taskCon.send(data+'\r\n');
						record2log(tasklog,data,1);
					}
				}catch(e){
					console.log('ERROR: '+e);
				}
			});
			socket.on(endEvent, function(){taskCon.close();tasklog.end();});
			taskCon.on('close', function(){if(socket.end)socket.end();else socket.close();tasklog.end();});
		}
	}catch(e){
		console.log(e);
	}
}
function startTaskService(taskName,task){
	if(task.server && task.server.exe){
		var taskprocess = run(task.server.exe,task.server.exeParams);
		taskprocess.stderr.on("data", function(data){
			console.error("------- Error in \""+task.stdio.exe+"\" ["+task.stdio.exeParams+"]\n"+data.toString()+"\n=======");
			killSpawnedProcess(taskprocess);
			socket.close();
			if(tasklog)tasklog.end();
		});
	}
	if(task.log){
		task.datapath=path.join(DATADIR,taskName)
		mkdir(task.datapath);
	}
	//Serve task over standard TCP Socket
	task.tcps = CreateTcpServer(function(socket){onActorConnection(task,socket,'data','end')}).listen(task.serveOnTCPPort);
	//Serve task over WebSocket
	task.wss = new WebSocket.Server({port: task.serveOnWSPort});
	task.wss.on('connection', function(socket){onActorConnection(task,socket,'message','close')});
}



////////////////////////////////////////
function startPlaybackService(){
	var wss = new WebSocket.Server({port: PLAYBACKPORT});
	wss.on('connection', function(ws){
		var taskpath,logpath,timestamp,linenum,lines=[];
		ws.on('message', function(msg){
			console.log(msg);
			data=JSON.parse(msg);
			if(!taskpath && data['Tasks']){
				var task=Object.keys(data['Tasks'])[0];
				taskpath=path.join(DATADIR,task);
				ws.send(JSON.stringify(null));
				ws.send(JSON.stringify({Task:task}));
				ws.send(JSON.stringify({'#logfiles':['_i'].concat(fs.readdirSync(taskpath))}));
			}else if(data['#logfiles']){
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
							if(line[1]=='1')
								ws.send('{"_A":'+line[2]+'}');
							else
								ws.send(line[2]);
							while((linenum+1)<lines.length && lines[linenum+1].trim()==""){
								++linenum;
							}
							if((++linenum)<lines.length){
								var nextln=lines[linenum].split('\t');
								nextln[0]=parseInt(nextln[0]);
								setTimeout(function(){nextLine(nextln);},nextln[0]-line[0]);
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
		ws.on('close', function(){
			linenum=lines.length;
		});
		ws.send(JSON.stringify("Logfile Playback"));
		ws.send(JSON.stringify({'Tasks':['_i'].concat(fs.readdirSync(path.join('.','data')))}));
	});
}



////////////////////////////////////////
mkdir(DATADIR);
var indexPage=fs.createWriteStream('index.html');
indexPage.write('<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"> \
<meta name="apple-mobile-web-app-capable" content="yes"> \
<meta name="mobile-web-app-capable" content="yes"> \
<html><body>');
for(taskName in TASKS){
	startTaskService(taskName,TASKS[taskName]);
	indexPage.write('<li><a href="stap.html?'+TASKS[taskName].serveOnWSPort+'">'+TASKS[taskName].desc+'</a> ');
}
indexPage.write('</body></html>');
indexPage.end();
startPlaybackService();


