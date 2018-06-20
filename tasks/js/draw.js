/* draw STAP-compliant task that can run
	- in-browser
		use this script alongside stap.js api2gui library, e.g.
			<html><head><script src=location/of/stap.js><script src=location/of/helloworld.js></head><body /></html>
		OR write your own in-browser GUI
			* must overload task.updateUI to process display changes
			* must call task.userAction for each user event/input
			* must call task.start() to start task
			* optionally overload task.end (it will be called at the end of the task)
	- as a console app, which can pipe io to agent (or serve via server like servep, websocketd, netcat)
		* in console, type "node helloworld.js"
	- as a node.js module
		* must overload task.updateUI to process display changes
		* must call task.userAction for each user event/input
		* must call task.start() to start task
		* optionally overload task.end (it will be called at the end of the task)
*/


var task = {
	
	start: function(){
		task.pathId=-1;
		task.mouseDown=false;
		task.updateUI({require:{e:[42,43,44,46]},template:"#draw {border:solid 1px gray}"});
		task.updateUI([ {id:"draw",title:"Draw a smiley face",w:400,h:400,e:[42,43,44,46]} ]);
	},
	
	userAction: function(time,id,val){
		if(val.constructor===Array){
			if(val[0]===42){						//mouseDown event
				task.newPath(val);
				task.mouseDown=true;
			}
			if(task.mouseDown){
				if(val[0]===43 || val[0]===46){		//mouseUp or mouseLeave event
					task.lineTo(val);
					task.mouseDown=false;
				}else if(val[0]===44){				//mouseMove event
					task.lineTo(val);
				}
			}
		}
	},
	
	newPath: function(val){
		task.updateUI([ {id:"draw",v:[{type:"path",w:400,h:400,x:0,y:0,v:[[val[1]/4,val[2]/4]]}]} ]);
		task.pathId++;
	},
	
	lineTo: function(val){
		task.updateUI([ {id:["draw",task.pathId],v:[[val[1]/4,val[2]/4]]} ]);
	}
	
	//the 2 functions defined above -- task.start() and task.userAction() --
	//	are expected by user-side software, so make sure you don't change their names.
	//
	//task.updateUI() is defined by user-side software. 
}


////////////////////////////////////////////////////////////////
// line below added for node.js
if(typeof(window)==='undefined'){task.end=function(){process.exit()};if(require.main===module){task.updateUI=function(data){console.log(JSON.stringify(data))};process.stdin.on("data",function(s){let data;try{data=JSON.parse(s)}catch(e){console.log('{"error":"invalid JSON string"}');return}if(data.constructor!==Array||data.length!=3){console.log('{"error":"Invalid STAP 7 response. Expected [time,id,value]"}');return}task.userAction(data[0],data[1],data[2])});task.start()}else{exports.task=task}}
////////////////////////////////////////////////////////////////
