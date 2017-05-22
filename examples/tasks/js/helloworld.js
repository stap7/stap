/* helloworld STAP-compliant task that can run
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


var task = {
	
	start: function(){
		//add "Hello, World!" text and a "Press Me" button to user display
		task.updateUI([ "Hello, World!", ["Press Me"] ]);
	},
	
	onUserAction: function([time,element,value]){
		if(element=='Press Me'){
			//when user presses the button, clear screen and add "You pressed the button!" text
			task.updateUI(null);
			task.updateUI([ "You pressed the button!" ]);
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
