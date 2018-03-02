This folder includes CGI (common gateway interface) scripts meant to be consumed via a STAP client (e.g. stapjs, actr-stap).

What is CGI?
* CGI scripts are stateless applications, and probably constitute the most common method of web-app development. Stateless applications assume that your script will be getting "hit" with a different URL (or POSTed data) to inform the script as to the current state of the given task.


- helloworld.sh is a simple shell script that will respond with a standard STAP message, i.e. json string.

- helloworld.py is more flexible, and will respond with json or jsonp, depending on whether the HTTP request included a callback parameter (jsonp is needed for cross-domain web applications).
