/* helloworld STAP-compliant task that can run
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
		//add "Hello, World!" text and a "Press Me" button to user display
		task.updateUI([ "Hello, World!", {"@Press Me":false} ]);
	},
	
	userAction: function([time,element,value]){
		if(element=='Press Me'){
			//when user presses the button, clear screen and add "You pressed the button!" text
			task.updateUI(null);
			task.updateUI([ "You pressed the button!" ]);
			//exit gracefully
			task.end();
		}
	}
	
	//the 2 functions defined above -- task.start() and task.userAction() --
	//	are expected by user-side software, so make sure you don't change their names.
	//
	//the 2 functions being called that are NOT defined above -- task.updateUI() and task.end() --
	//	are defined by user-side software. 
}


////////////////////////////////////////////////////////////////
// line below added for node.js
if(typeof(window)==='undefined'){task.end=function(){process.exit()};if(require.main===module){task.updateUI=function(data){console.log(JSON.stringify(data))};process.stdin.on("data",function(s){let data;try{data=JSON.parse(s)}catch(e){console.log('{"error":"invalid JSON string"}');return}if(data.constructor!==Array||data.length!=3){console.log('{"error":"Invalid STAP 7 response. Expected [time,element,value]"}');return}task.userAction(data)});task.start()}else{exports.task=task}}
////////////////////////////////////////////////////////////////
