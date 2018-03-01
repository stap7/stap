Standard input/output (stdio) console applications are very versatile, and may be written in any language.

Stdio STAP task software may be piped to agent software running on the same machine, or served for agents over TCP.

Server software such as websocketd and servep may be employed to serve up a new instance of an stdio application for each client as a stateful HTTP or Websocket connection.
Importantly, the client may be either, a human participant that views a given task using a web-browser (via a stap.js webpage, or equivalent HTML5 library), 
or a computational participant that may interpret STAP messages directly.

