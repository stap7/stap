/* 1st grade math STAP-compliant task that can run
	- in-browser
		* must define userAgent object before this script is loaded, where
			* userAgent.update(data) is used to update user display
			* userAgent.action(data) is an overloadable function that is called on each user action
	- as a console app, which can pipe io to agent (or serve via server like servep or websocketd)
		* in console, type "node helloworld.js"
	- as a node.js module
		* must overload task.updateUI to process display changes
		* must call task.onUserAction for each user action
		* optionally overload task.end (it will be called at the end of the task)
		* must call task.start() to start task
*/


////////// supporting functionality //////////
if(!Array.prototype.last)Array.prototype.last=function(){return this[this.length-1];};
if(!Math.randbtwn)Math.randbtwn=function(min,max){return Math.floor(Math.random()*(max-min+1))+min;};
//////////////////////////////////////////////

var stap = {
	clear: null,
	button: (val) => [String(val)]
}

var task = {
	
	start: function(){
		task.trials=20;
		task.doTrial();
	},
	
	doTrial: function(){
		//set up problem
		var x=Math.randbtwn(10,20);
		var y=Math.randbtwn(1,4);
		var operation=Math.randbtwn(0,1);
		task.correct=operation?x+y:x-y;
		var answers=[task.correct];
		for(var i=0;i<Math.randbtwn(0,3);++i){
			answers.unshift(answers[0]-Math.randbtwn(1,2));
		}
		for(var i=answers.length;i<4;++i){
			answers.push(answers.last()+Math.randbtwn(1,2));
		}
		//clear screen
		task.updateUI(stap.clear);
		//add question and answer buttons to user display
		task.updateUI([ ["Questions left",task.trials--], ["Question",[x,["-","+"][operation],y]], ["Answers",answers.map(stap.button)] ]);
	},
	
	onUserAction: function([time,element,value]){
		if(task.trials){
			if(element.constructor===String){
				//clear screen
				task.updateUI(stap.clear);
				if(element=='Next Question'){
					task.doTrial();
				}else if(element==''+task.correct){
					task.updateUI([ "Correct!", stap.button('Next Question') ]);
				}else{
					task.updateUI([ "Incorrect.", stap.button('Next Question') ]);
				}
			}
		}else{
			//clear screen
			task.updateUI(stap.clear);
			task.updateUI([ "Thanks, and have a great day!" ]);
			//exit gracefully
			task.end();
		}
	},
	
	//overloadable function called at end of task for cleanup
	end: function(){},
	
	//overloadable function for updating user-interface with STAP objects
	updateUI: function(){}
	
}



////////////////////////////////////////////////////////////////
// account for 3 run environments: in browser, as a console app, loaded as a module
if(typeof(window) !== 'undefined'){
	//if this script is running in a browser
	//	* userAgent must be defined before loading this script
	//	connect userAgent.action to task.onUserAction
	userAgent.action = task.onUserAction;
	//	connect task.updateUI to userAgent.update;
	task.updateUI = userAgent.update;
	//	start task
	task.start();
}else if(require.main === module){
	//if this script is running a standalone console app
	//	pipe userAgent.update to stdout
	task.updateUI = function(data){console.log(JSON.stringify(data))};
	//	pipe stdin to task.onUserAction
	process.stdin.on("data",function(s){
		let data;
		try{data=JSON.parse(s);}
		catch(e){console.log('{"error":"bad input - expected a valid JSON string"}');return;}
		if(data.constructor!==Array){console.log('{"error":"bad input - expected a valid STAP 6.0 user response"}');return;}
		task.onUserAction(data);
	});
	//	when the task is done, exit the console process
	task.end=function(){process.exit()};
	//	start task
	task.start();
}else{
	//if this script is being loaded as a node.js module
	exports.task = task;
	//	* must overload task.updateUI
	//	* must call task.onUserAction for each user action
	//	* optionally overload task.end (it will be called at the end of the task)
}
////////////////////////////////////////////////////////////////
