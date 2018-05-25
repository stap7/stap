This folder includes CGI (common gateway interface) scripts meant to be consumed via a STAP client (e.g. stapjs, actr-stap).

What is CGI?
* CGI scripts are stateless applications, and probably constitute the most common method of web-app development. Stateless applications assume that either (1) your script will be getting "hit" with a different URL (or POSTed data) to inform the script as to the current state of the given task, or (2) state information is saved on server in a database or file.

How to use STAP with stateless CGI?
1) Write CGI scripts that do not require any state information (e.g. helloworld.py, helloworld.sh)
2) Write CGI scripts such that STAP button/input id's are more informative (e.g. pvt.py)
3) Write CGI scripts such that state information is parroted back (e.g. a client, such as stapjs, may look for "X-parrot" and "X-append-to-url" headers, and either parrot header right back as a request header, or as the query string in the request URL)
4) Write CGI scripts that store state information in a database or file


- helloworld.sh is a simple shell script that will respond with a standard STAP message

- helloworld.py is slightly more complex, and responds to button clicks

- pvt.py (a reaction-time task) is an example of how state information can be included in buttons/inputs
