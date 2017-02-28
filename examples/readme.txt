Current folder includes sample STAP task and gui software.
	
	To try out included examples, we suggest downloading/installing:
		- python3 from [https://www.python.org/]
			used to run included stdio and cgi scripts
				(convinient for running computational agents on STAP tasks)
		- websocketd from [http://websocketd.com/]
			used to serve included task scripts using websocket or http/cgi/jsonp protocols
				(convinient for web experiments with human or computational participants)
		- a modern web browser, like Chrome [https://www.google.com/chrome/]
			used to present STAP tasks to human users

			
Try it out:
	
	Make sure you have python3 (if not, download and install from https://www.python.org/)
	
	Download and install websocketd:
		- go to http://websocketd.com and click Download (they have versions for every OS)
		- download the websocketd zip file for your OS, unzip it
		- optionally, put the websocketd executable in your applications folder

	Start http, cgi, and websocket services:
		- open terminal window (linux, freeBSD, or DOS shell), and run websocketd:
			
			path/to/websocketd --port 8080 --staticdir path/to/stap6/examples/api2gui --cgidir path/to/stap6/examples/tasks/stateless/cgi-bin/ --dir path/to/stap6/examples/tasks/stdio
				(optionally, port parameter can be anything other than 8080)
				(optionally, staticdir parameter may be omitted if you don't need serve the included html5 GUI)
				(optionally, cgidir parameter may be omitted if you don't need serve the included cgi scripts)
		
		That's it.
		Now you are serving tasks in the examples/tasks/stdio folder over websockets and as cgi scripts.
		
		To try each websocket task in the browser go to:
			http://localhost:8080/stap.html?l=ws://localhost:8080/helloworld.py
			http://localhost:8080/stap.html?l=ws://localhost:8080/twoarm.py
			http://localhost:8080/stap.html?l=ws://localhost:8080/shj.py
			http://localhost:8080/stap.html?l=ws://localhost:8080/pvt.py
			http://localhost:8080/stap.html?l=ws://localhost:8080/timeestimation.py
			http://localhost:8080/stap.html?l=ws://localhost:8080/draw.py

		To try each stateless cgi task in the browser go to:
			http://localhost:8080/stapp.html?l=http://localhost:8080/helloworld.sh
			http://localhost:8080/stapp.html?l=http://localhost:8080/helloworld.py


Contents:
	
	api2gui/
		example of webbrowser-based client-side STAP interpretation software for human users
	
	
	tasks/stdio/
		STAP task scripts that interact over the standard input/output streams.
		stdio streams may be piped to connect local clients to tasks,
			they may also be served over TCP using netcat or a similar tool,
			and may be served over websockets for local or remote task participation. 
	
	tasks/stateless/
		Stateless scripts are scripts that are executed by a generic webserver.
		The reason these scripts are called "stateless" is because each time a URL for a script is requested, that script is executed to completion; thus variable values in task script do not survive two consecutive message exchanges with the user.
		Stateless interactions may be too slow for dynamic tasks with lots of message exchanges.
		Stateless folder includes:
			cgi-bin/
				standard cgi script examples that can run on any cgi-enabled webserver
			hook.io/
				webhook examples in python3 that will run on hook.io free webhook service
			nanoscale.io/
				webhook examples in javascript that will run on nanoscale.io free webhook service

