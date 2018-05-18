/* basic algebra STAP-compliant task that can run
	- in-browser
		use this script alongside stap.js api2gui library, e.g.
			<html><head><script src=location/of/stap.js><script src=location/of/1stGradeMath.js></head><body /></html>
		OR write your own in-browser GUI
			* must overload task.updateUI to process display changes
			* must call task.userAction for each user event/input
			* must call task.start() to start task
			* optionally overload task.end (it will be called at the end of the task)
	- as a console app, which can pipe io to agent (or serve via server like servep, websocketd, netcat)
		* in console, type "node 1stGradeMath.js"
	- as a node.js module
		* must overload task.updateUI to process display changes
		* must call task.userAction for each user event/input
		* must call task.start() to start task
		* optionally overload task.end (it will be called at the end of the task)
*/


////////// supporting functionality //////////
if(!Array.prototype.last)Array.prototype.last=function(){return this[this.length-1];};
if(!Math.randbtwn)Math.randbtwn=function(min,max){return Math.floor(Math.random()*(max-min+1))+min;};
//////////////////////////////////////////////

var stap = {
	clear: null,
	button:function(name){return {id:name+'',v:false};}
};

var task = {
	
	start: function(){
		task.trials=20;
		task.score=0;
		task.updateUI(stap.clear);
		task.doTrial();
	},
	
	doTrial: function(){
		var x,y,i,operation,answer;
		//set up problem
		x=Math.randbtwn(10,20);
		y=Math.randbtwn(1,4);
		operation=Math.randbtwn(0,1);
		task.correct=operation?x+y:x-y;
		answers=[task.correct];
		for(i=0;i<Math.randbtwn(0,3);++i){
			answers.unshift(answers[0]-Math.randbtwn(1,2));
		}
		for(i=answers.length;i<4;++i){
			answers.push(answers.last()+Math.randbtwn(1,2));
		}
		//add question and answer buttons to user display
		task.updateUI([ {id:"Questions left",v:task.trials--},
						{id:"Question",v:[x,["-","+"][operation],y]},
						{id:"Answers",v:answers.map(stap.button)} ]);
	},
	
	userAction: function(time,id,value){
		if(task.trials){
			if(id.constructor===String){
				//clear screen
				task.updateUI(stap.clear);
				if(id=='Next Question'){
					task.doTrial();
				}else if(id==''+task.correct){
					task.score++;
					task.updateUI([ "Correct!", stap.button('Next Question') ]);
				}else{
					task.updateUI([ "Incorrect.", stap.button('Next Question') ]);
				}
			}
		}else if(task.trials==0){
			//clear screen
			task.updateUI(stap.clear);
			task.updateUI([ {id:"Score",v:task.score}, "Thanks, and have a great day!" ]);
			//exit gracefully
			task.end();
		}
	},
	
};


////////////////////////////////////////////////////////////////
// line below added for node.js
if(typeof(window)==='undefined'){task.end=function(){process.exit()};if(require.main===module){task.updateUI=function(data){console.log(JSON.stringify(data))};process.stdin.on("data",function(s){var data;try{data=JSON.parse(s)}catch(e){console.log('{"error":"invalid JSON string"}');return}if(data.constructor!==Array||data.length!=3){console.log('{"error":"Invalid STAP 7 response. Expected [time,id,value]"}');return}task.userAction(data[0],data[1],data[2])});task.start()}else{exports.task=task}}
////////////////////////////////////////////////////////////////
