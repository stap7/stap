Current folder includes STAP task script examples.

Contents:
	
	api2gui/
		example of webbrowser-based client-side STAP interpretation software for human users
	
	
	tasks/stdio/
		STAP task scripts that interact over the standard input/output streams.
		stdio streams may be piped locally to compuational agents or redirected and served over sockets for web access
		
		An easy way to run STAP stdio scripts as websocket is by using websocketd:

			- go to http://websocketd.com and click Download (they have versions for every OS)
			- download the websocketd zip file for your OS, unzip it
			- optionally, put the websocketd executable in your applications folder
			- open terminal (or DOS window), and run websocketd (or websocketd.exe):
			
				path/to/websocketd --port 8080 --staticdir path/to/stap6/examples/api2gui --dir path/to/stap6/examples/tasks/stdio
					(optionally port can be anything other than 8080)
			
			That's it.
			Now you are serving tasks in the examples/tasks/stdio folder over websockets.
			To try each task in the browser go to:
				http://localhost:8080/stapws.html?l=ws://localhost:8080/helloworld.py
				http://localhost:8080/stapws.html?l=ws://localhost:8080/twoarm.py
				http://localhost:8080/stapws.html?l=ws://localhost:8080/shj.py
				http://localhost:8080/stapws.html?l=ws://localhost:8080/pvt.py
				http://localhost:8080/stapws.html?l=ws://localhost:8080/timeestimation.py
				http://localhost:8080/stapws.html?l=ws://localhost:8080/draw.py
	
	
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
