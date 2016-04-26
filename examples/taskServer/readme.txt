
Do you have a STAP-compliant task running as a WebSocket server?

 -- No:
   Use the included stdio2socketServ.js to start a WebSocket service.
   Don't have node.js installed?
     -- install Node.js from nodejs.org
   Don't have ws and minimist node.js libraries (or not sure)?
     -- Use npm (node.js should have come with npm):
       npm install -g ws
       npm install -g minimist
   Run node stdio2socketServ.js --help to see the usage text.
   As an example, assuming you have Python, and sample Python task
     scripts in ../tasks/, run the following:
     node stdio2socketServ.js ../tasks/helloworld.py -w 8719 -h helloworld.htm
	 Double-click helloworld.htm
 
 -- Yes:
   Double-click stap.html to open it in your web browser.
   If your WebSocket service is on port 8719, that's it.
   If not, you'll have to add "?" followed by your WebSocket port
     number at the end of the string in the browser location bar.
     For example, if the port number is 9999 and stap.html is in
     C:/stap/examples/taskServer/ then url will be:
     file:///C:/stap/examples/taskServer/stap.html?9999

