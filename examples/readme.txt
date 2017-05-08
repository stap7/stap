Current folder includes sample STAP task and gui software.
    
    To try out included examples, we suggest downloading/installing:
        - a modern web browser, like Chrome [https://www.google.com/chrome/]
            used to present STAP tasks to human users
        - python3 [from https://www.python.org/]
            used to run included task scripts
        - servep [via npm installer; npm installer comes with node.js from https://nodejs.org/]
            used to serve included task scripts and web pages


Try it out:
    
    Make sure you have python3 (if not, download and install from https://www.python.org/)
    
    Download and install servep:
        - go to https://nodejs.org; download and install node
        - open terminal window and type:
            npm install -g servep
            (you may need to precede the previous line with "sudo" on linux)

    Start tcp, http ,and websocket services:
        - open terminal window and start servep:
            
            servep path/to/stap6/examples/api2gui --port 8080 --log path/to/logfiles --py path/to/python3 --ws path/to/stap6/examples/tasks/stdio --tcp path/to/stap6/examples/tasks/stdio --http path/to/stap6/examples/tasks/stdio
                (optionally, port parameter can be anything other than 8080)
                (optionally, log parameter may be omitted if you do not require logging/playback)
                (optionally, py parameter may be omitted if you are not on Windows, have python3 in $PATH, and the scripts in examples/tasks/stdio are executable)
                (optionally, path/to/stap6/examples/api2gui may be omitted if you don't need serve the included html5 GUI)
                (optionally, ws, tcp, and/or http parameters may be omitted if you don't need serve the included task scripts over those protocols)
        
        That's it.
        Now you are serving tasks in the examples/tasks/stdio folder over tcp/http/websockets.
        
        To try each task in the browser using websockets go to:
            http://localhost:8080/stap.html?l=helloworld.py
            http://localhost:8080/stap.html?l=twoarm.py
            http://localhost:8080/stap.html?l=addition.py
            http://localhost:8080/stap.html?l=shj.py
            http://localhost:8080/stap.html?l=pvt.py
            http://localhost:8080/stap.html?l=timeestimation.py
            http://localhost:8080/stap.html?l=draw.py

        To try each task in the browser without using websockets (more lag) go to:
            http://localhost:8080/stapp.html?l=helloworld.py
            http://localhost:8080/stapp.html?l=twoarm.py
            http://localhost:8080/stapp.html?l=addition.py
            http://localhost:8080/stapp.html?l=shj.py
            http://localhost:8080/stapp.html?l=pvt.py
            http://localhost:8080/stapp.html?l=timeestimation.py
            http://localhost:8080/stapp.html?l=draw.py
        
        To interact with these scripts over headless TCP, you may use netcat to connect
            over ports 9000, 9001, ...
            (other TCP ports may be specified; see servep documentation by typing "servep --help" in terminal)


Contents:
    
    api2gui/
        STAP software for human participants (webbrowser-based)
    
    tasks/stdio/
        STAP task scripts that interact over the standard input/output streams.
        stdio streams may be piped to connect local participants to tasks.
            They may also be served over TCP, HTTP, or Websockets for remote
            human and computational participants. 
    
    tasks/stateless/
        Stateless scripts are scripts that are executed by a generic webserver.
        The reason these scripts are called "stateless" is because each time a URL for a script is requested, that script is executed to completion; thus variable values in task script do not survive two consecutive message exchanges with the user.
        Stateless interactions may be too slow for dynamic tasks with lots of message exchanges.
        Stateless folder includes:
            cgi-bin/
                standard cgi script examples that can run on any cgi-enabled webserver (e.g. Apache)
            hook.io/
                webhook examples in python3 that will run on hook.io free webhook service
            nanoscale.io/
                webhook examples in javascript that will run on nanoscale.io free webhook service


Notes:
	
	The included scripts and instructions should not be taken as dogma for how to develop and run STAP task and participant software.
	The included task scripts can be served without the use of servep (for example, you can use websocketd to serve over websockets, and netcat to serve over headless TCP).
	Similarly, the api2gui layer does not have to be written in HTML5.
	The important thing is that the updates to the user's [virtual or graphical] UI are driven via a standard API (STAP), and that user actions are sent/received via this API, as well.

	
