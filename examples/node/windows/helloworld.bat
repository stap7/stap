start node.exe ..\..\taskServer\stdio2socketServ.js "python ..\..\tasks\helloworld.py" -w 8800 -h "..\..\taskServer\helloworld.html"
timeout 3
start ..\..\taskServer\helloworld.html
